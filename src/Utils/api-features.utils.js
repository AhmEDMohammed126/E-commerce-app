export class ApiFeatures {
    //model:modelName  
    //query:req.query  
    constructor(model, query,populate=[]) {
        this.query = query;
        this.model = model;
        this.filterObject={};
        this.paginationObject={};
        this.populate=populate;
    }
    //sorting
    sort() {
        //send sort in postman as sort[price] as key an valueas desc or asc  or sort as key and -price or price as value
        const {sort}=this.query;
        if(sort){
            this.paginationObject.sort=sort;
        }
        this.mongooseQuery=this.model.paginate(this.filterObject,this.paginationObject)
        return this;
    }

    //pagination
    pagination() {
        const{page=1,limit=3,populate,userId}=this.query
        const skip=(page-1)*limit
        this.paginationObject = {
            page:parseInt(page),
            limit:parseInt(limit),
            skip
        }
        if(this.populate.length){
            this.paginationObject.populate=this.populate
        }
        this.mongooseQuery=this.model.paginate(this.filterObject,this.paginationObject)

        return this;
    }

    //filtering
    filter() {
        const{page=1,limit=3,sort,userId,...filters}=this.query
        const filterAsString=JSON.stringify(filters);
        const replacedFilter=filterAsString.replaceAll(/gt|gte|lt|lte|regex|ne|eq/g,key=>`$${key}`);
        this.filterObject={
            ...this.filterObject,
            ...JSON.parse(replacedFilter)
        };
        this.mongooseQuery=this.model.paginate(this.filterObject,this.paginationObject)
        return this; 
    }
}