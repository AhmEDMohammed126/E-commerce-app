import { Address, User } from "../../../DB/Models/index.js"
import { sendEmailService } from "../../../services/send-email.service.js"
import { compareSync, hashSync } from "bcrypt"
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import otpGenerator from "otp-generator";
import { cloudinaryConfig, ErrorClass, uploadFile } from "../../Utils/index.js";
import {OAuth2Client} from "google-auth-library";
/**
 * @api {post} /users/register  Register a new user
 */
export const registerUser = async(req, res,next) =>{
    const {userName,email,password,userType,gender,age,phone,country,city,postalCode,buildingNumber,floorNumber,addressLable}=req.body

    // check if the email is already registered
    const existingUser=await User.findOne({$or:[{email,isMarkedAsDeleted:false},{userName}]})
    if(existingUser)
        return next(
            new ErrorClass("Invalid credentials", 400, "Email or User name is already registered")
        );
    // upload the image to cloudinary
    if(!req.file)return next(new ErrorClass('Please upload an image',400,'Please upload an image'));
    const customId = nanoid(4);
    const { secure_url, public_id } = await uploadFile({
        file: req.file.path,
        folder: `${process.env.UPLOADS_FOLDER}/Users/${customId}`,
    });
    
    const userInstance=new User({
        userName,
        email,
        password,
        profilePic:{
            public_id,
            secure_url
        },
        customId,
        userType,
        gender,
        age,
        phone,
    })
    //create new address instance
    const addressInstance=new Address({
        userId:userInstance._id,
        country,
        city,
        postalCode,
        buildingNumber,
        floorNumber,
        addressLable,
        isDefault:true
    })
    //generate token instead of sending _id
    const confirmationToken = jwt.sign(
        { user: userInstance },
        process.env.CONFIRM_TOKEN,
        { expiresIn: "1h" }
    );
    // generate email confirmation link
    const confirmationLink = `${req.protocol}://${req.headers.host}/users/confirmation/${confirmationToken}`;
    //sending email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: "welcome",
        htmlMessage: `<a href=${confirmationLink}>please verify your account</a>`,
    });

    if (isEmailSent.rejected.length) {
        return res
            .status(500)
            .json({ message: "verification email sending is failed " });
    }

    await userInstance.save();
    const savedAddress=await addressInstance.save();
    res.status(201).json({message:"User created successfully",data:userInstance,savedAddress})
}

/**
 * @api {get} /users/confirmation/:confirmationToken  Verify Email
 * @param {req} req 
 * @param {res} res 
 * @param {next} next 
 * @returns  {object} return response {message, user}
 * @description verify Email of user
 */
export const verifyEmail = async (req, res, next) => {
    //destruct token from params
    const { confirmationToken } = req.params;
    //verifing the token
    const data = jwt.verify(confirmationToken, process.env.CONFIRM_TOKEN);
    const confirmedUser = await User.findOneAndUpdate(
        { _id: data?.user._id, isEmailVerified: false },
        { isEmailVerified: true },
        { new: true }
    );
    if (!confirmedUser) {
        return next(
            new ErrorClass("Invalid credentials", 400, "not confirmed")
        );
    }
      // response
    res.status(200).json({ message: "User email successfully confirmed ", confirmedUser });
};

/***
 * @api {post} /users/login  Login user
 * @param {object} req
 * @param {object} res
 * @param {object} next
 * @returns {object} return response {message, token}
 * @description login user
 */
export const login = async (req, res, next) => {
    // destruct email and password from req.body
    const { email, password } = req.body;
    // find user
    const user = await User.findOne({email,isEmailVerified:true,isMarkedAsDeleted:false});
    if (!user) {
        return next(
            new ErrorClass("Invalid credentials", 400, "Invalid email or password")
        );
    }
    const isMatch = compareSync(password, user.password);
    if (!isMatch) {
        return next(
            new ErrorClass("Invalid credentials", 400, "Invalid email or password")
        );
    }
    //update status
    user.status = true;
    await user.save();
    // generate the access token
    const token = jwt.sign({ userId: user._id }, process.env.LOGIN_SECRET,{expiresIn: "1d"});
    // response
    res.status(200).json({ message: "Login success", token });
};

/**
 * @api {patch} /users/logout  Logout user
 */
export const logOut = async (req, res, next) => {
    //destruct user from req
    const { authUser } = req;
    //find user
    const user = await User.findById(authUser._id);
    //update status of user
    user.status = false;
    await user.save();
    //respons
    res.status(200).json({ message: "logged out successfuly" });
};
/**
 * @api {put} /users/update-account/:userId  Update account
 */
export const updateAccount=async(req, res,next) => {
    const {authUser}=req;
    const {userName,email,gender,age,phone,public_id}=req.body;
    const isUserNameOrEmailExist=await User.findOne({$or:[{userName},{email}]})
    if(isUserNameOrEmailExist) return res.status(400).json({message:"user name or email already exist"})
    const user=await User.findById(authUser._id);
    if(email){
        user.isEmailVerified = false;
        const confirmationToken=jwt.sign({user:user},process.env.CONFIRM_TOKEN,{expiresIn:"1h"});
        const confirmationLink =`${req.protocol}://${req.headers.host}/users/confirmation/${confirmationToken}`; 
        const isEmailSent=await sendEmailService({
            to:email,
            subject:"verify your email",
            htmlMessage:`<a href=${confirmationLink}>please verify your account</a>`
        })
        if(isEmailSent.rejected.length) 
            return next(
                new ErrorClass("Invalid credentials", 400, "email sending is failed")
            ); 
    }
    
    if(public_id){
        if(req.file){
            const Newpublic_id = user.profilePic.public_id.split(`${user.customId}/`)[1];
            const {secure_url}=await uploadFile({
                file: req.file.path,
                folder: `${process.env.UPLOADS_FOLDER}/Users/${user.customId}`,
                publicId: Newpublic_id
                }
            )
            user.profilePic.secure_url=secure_url   
        }     
    }
    user.userName=userName || user.userName
    user.email=email || user.email
    user.gender=gender || user.gender
    user.age=age || user.age
    user.phone=phone || user.phone
    const updatedUser=await user.save()
    if(!updatedUser) return res.status(404).json({message:"user not found"})
    return res.status(200).json({message:"updated"})
}
/**
 * @api {get} /users/get-info  Get user info
 */
export const getInfo = async (req, res, next) => {
    //destruct user from req
    const { authUser } = req;
    //find user
    const user = await User.findById(authUser._id).select("-password -_id -otp");
    //response
    res.status(200).json({ user });
};

/**
 * @api {get} /users/get-by-id/:id  Get user by id
 */
export const getById = async (req, res, next) => {
    //destruct id from params
    const { _id } = req.params;
    //find user
    const user = await User.findById(_id).select("-password -_id -otp");
    //response if user not exist
    if (!user) {
        return next(
            new ErrorClass(
            "there is no matched users",
            400,
            "there is no matched users"
            )   
        );
    }
    //response
    res.status(200).json({ user });
};
/**
 * @api {patch} /users/update-password  Update password
 */
export const updatePassword = async (req, res, next) => {
    //destruct user from req
    const { authUser } = req;
    const user = await User.findById(authUser._id);
    //destruct password from body
    const {oldPassword, password } = req.body;
     // compare password
    const isMatch = compareSync(oldPassword, user.password);
    if (!isMatch){
        return next(
            new ErrorClass("Invalid credentials", 400, "old Password not true")
        );
    };
    user.password=password;
    await user.save();
    //response
    res.status(200).json({ message: "user password updated "});
};

/**
 * @api {post} /users/forget-password  Forget password
 */
export const forgetPassword = async (req, res, next) => {
    // Get the email from the request body
    const { email } = req.body;
    // Find the user with the provided email or recovery email
    const isUserExists = await User.findOne({email,isMarkedAsDeleted:false});
    // If the user does not exist, throw an error
    if (!isUserExists) {
        return next(
            new ErrorClass("email doesn't exist", 400, "email doesn't exist")
        );
    }
    // Generate a random password reset code
    const otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        specialChars: false,
    });
    isUserExists.otp = otp;
    // Send an email to the user with a random hashed reset code
    const isEmailSent = await sendEmailService({
        to: email,
        subject: `welcome ${isUserExists.userName}`,
        htmlMessage: `<h1>your verify code for reseting the password is : ${otp}  it is valid for 10 minutes</h1>`,
    });
    // If the email sending fails, return an error response
    if (isEmailSent.rejected.length) {
        return res
        .status(500)
        .json({ message: "verification email sending is failed " });
    }
    // Set the password reset expiration time to 10 minutes from now
    isUserExists.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    isUserExists.verifyPasswordReset=false;
    // Save the updated user
    await isUserExists.save();
    // Return a success response
    res.status(200).json({ message: "check your email for password reset code" });
};

/**
 * @api {post} /users/verify-forget-password  Verify forget password
 */
export const verifyForgetPassword = async (req, res, next) => {
    // Get the otp from the request body
    const {otp } = req.body;
    // Find the user 
    const isUserExists = await User.findOne({
        otp:otp,
        passwordResetExpires: { $gt: Date.now() },
    }) 
    // If the user does not exist, throw an error
    if (!isUserExists) {
        return next(
            new ErrorClass("invalid code or code expired", 400, "invalid code or code expired")
        );
    }

    // Set the password reset code to null
    isUserExists.otp = null;  
    isUserExists.verifyPasswordReset=true;
    // Save the updated user
    await isUserExists.save();
    res.status(200).json({ message: "code verified successfully" });
};  

/**
   * @api {post} /users/reset-password  Reset password
   * @param {Object} req - The request object.
   * @param {Object} req.body - The request body containing the email and new password.
   * @param {string} req.body.email - The email of the user.
   * @param {string} req.body.password - The new password for the user.
   * @param {Object} res - The response object.
   * @param {Function} next - The next middleware function.
   * @returns {Promise<void>} - A promise that resolves when the password is reset successfully.
   * @throws {Error} - If the user with the provided email does not exist.
   * @throws {Error} - If the password reset code is not verified for the user.
   */
export const resetPassword = async (req, res, next) => {
    // Get the email and new password from the request body
    const { email, password } = req.body;
    // Find the user by the password reset token
    const user = await User.findOne({ email: email ,isMarkedAsDeleted:false}); 
    // If the user does not exist, throw an error
    if (!user) {
        return next(
            new ErrorClass("ther is no user with this email", 400, "ther is no user with this email")
        );
    }
    // If the password reset code is not verified for the user, throw an error
    if(!user.verifyPasswordReset){
        return next(
            new ErrorClass("reset code not verified", 400, "invalid reset code")
        );
    }
    // Delete the password reset and verification fields from the user object
    user.verifyPasswordReset = undefined;//to delet it from db
    user.passwordResetExpires = undefined;

    // Save the updated user
    await user.save();
    // Return a success response
    res.status(200).json({ message: "password reset successfully" });
};

/**
 * @api {put} /users/soft-delete-user  soft delete user
*/
export const softDeleteUser = async (req, res, next) => {
    const {authUser}=req;
    const user=await User.findByIdAndUpdate(authUser._id,{isMarkedAsDeleted:true,status:false},{new:true})
    if(!user)
        return next(
            new ErrorClass("ther is no user with this email", 400, "user not found")
        );
    return res.status(200).json({message:"user deleted"})
}

/**
 * @api {delete} /users/delete-user  soft delete user
*/
export const deleteUser = async (req, res, next) => {
    const _id=req.query?._id || req.authUser._id;
    const user=await User.findByIdAndDelete(_id)
    if(!user) 
        return next(
            new ErrorClass("ther is no user with this email", 400, "user not found")
        );
    //delete images from cloudinary
    const userPath=`${process.env.UPLOADS_FOLDER}/Users/${user?.customId}`
    await cloudinaryConfig().api.delete_resources_by_prefix(userPath);
    await cloudinaryConfig().api.delete_folder(userPath);
    await Address.deleteMany({userId:_id});
    return res.status(200).json({message:"user deleted"});
}

/**
 * @api {post} /users/loginWithGoogle  login with google
 */

export const loginWithGoogle= async (req,res,next)=>{
    const {idToken}=req.body;
    const client = new OAuth2Client();
async function verify() {
    const ticket = await client.verifyIdToken({
        idToken,
        audience:process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    return payload;
}

const result=await verify().catch(console.error);
if(!result.email_verified){
    return next(
        new ErrorClass("email not verified", 400, "email not verified")
    );
}
//verify user in db
const user=await User.findOne({email:result.email,isMarkedAsDeleted:false,provider:"google"});
if(!user){
    return next(
        new ErrorClass("invalid credentials", 400, "user not found")
    );
}
// generate the access token
const token = jwt.sign({ userId: user._id,email:result.email },process.env.LOGIN_SECRET,{expiresIn: "1d"});
user.isLogedIn = true;
user.status = true;
await user.save();
res.status(200).json({message:"login with google success",token})
}

/**
 * @api {post} /users/registerWithGoogle  register with google
 */

export const registerWithGoogle= async (req,res,next)=>{
    const {idToken}=req.body;
    const client = new OAuth2Client();
    async function verify() {
        const ticket = await client.verifyIdToken({
            idToken,
            audience:process.env.CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });
        const payload = ticket.getPayload();
        return payload;
    }

    const result=await verify().catch(console.error);  
    if(!result.email_verified){
        return next(
            new ErrorClass("email not verified", 400, "email not verified")
        );
    }
    // check if the email is already registered
    const existingUser=await User.findOne({email:result.email,isMarkedAsDeleted:false})
    if(existingUser)
        return next(
            new ErrorClass("Invalid credentials", 400, "Email or User name is already registered")
        );
    
    const userInstance=new User({
        userName:result.name,
        email:result.email,
        password:nanoid(8),
        userType:"Buyer",
        gender:"male",
        age:20,
        phone:"01024333443",
        provider:"google"
    })
    await userInstance.save();
    res.status(201).json({message:"User created successfully",data:userInstance})   
}