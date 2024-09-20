import QRCode from 'qrcode';

export  const genrateQrCode=async(data)=>{
    const qr=await QRCode.toDataURL([JSON.stringify(data)],{
        errorCorrectionLevel:'H',
    });//it accept strings

    return qr;
}

//used in create order 