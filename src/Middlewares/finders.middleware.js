import { ErrorClass } from "../Utils/index.js";

// find Document With name
export const getDocumentByName = (model) => {
  return async (req, res, next) => {
    const { name } = req.body;
    if (name) {
      const document = await model.findOne({ name });
      if (document) {
        return next(
          new ErrorClass(
            `${model.modelName} Document not found`,
            404,
            `${model.modelName} Document not found`
          )
        );
      }
    }
    next();
  };
};

// // find Document With _id
// export const getDocumentById = (model) => {
//   return async (req, res, next) => {
//     const { _id } = req.params;
//     const document = await model.findById(_id);
//     if (!document) {
//       return next(
//         new ErrorClass(
//           `${model} Document not found`,
//           404,
//           `${model} Document not found`
//         )
//       );
//     }
//     req.document = document;
//     next();
//   };
// };