const MongoClient=require('mongodb').MongoClient;
const DB_CONN_STR='mongodb://localhost:27017/userinfo';

function DBHelp(){}

/**************************
*
* 功能：条件查询，返回遇到的第一条符合条件的数据
* 参数：tableName(查询的表名)、selectStr(查询条件)、callback(回调函数)
*
**************************/
DBHelp.prototype.FindOne=function(tableName,selectStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).findOne(selectStr,function(err,result)
        {
            if(err)
            {
                console.log(err);
                return;
            }
            callback(result);
        });
        db.close();
    });
};

/**************************
*
* 功能：条件查询
* 参数：tableName(查询的表名)、selectStr(查询条件)、callback(回调函数)
*
**************************/
DBHelp.prototype.Find=function(tableName,selectStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).find(selectStr).toArray(function(err,result)
        {
            if(err)
            {
                console.log(err);
                return;
            }
            callback(result);
        });
        db.close();
    });
};

/**************************
*
* 功能：查询所有数据，显示指定字段
* 参数：tableName(查询的表名)、selectStr(查询条件)、callback(回调函数)
*
**************************/
DBHelp.prototype.FindAll=function(tableName,selectStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).find({},selectStr).toArray(function(err,result)
        {
            if(err)
            {
                console.log(err);
                return;
            }
            callback(result);
        });
        db.close();
    });
};

/**************************
*
* 功能：添加
* 参数：tableName(查询的表名)、dataStr(添加的数据)、callback(回调函数)
*
**************************/
DBHelp.prototype.Add=function(tableName,dataStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).insert(dataStr,function(err)
        {
            if(err)
            {
                console.log(err);
                return false;
            }
            else
            {
                callback();
            }
        });
        db.close();
    });
};

/**************************
*
* 功能：删除
* 参数：tableName(查询的表名)、delStr(删除条件)、callback(回调函数)
*
**************************/
DBHelp.prototype.Delete=function(tableName,delStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).remove(delStr,function(err)
        {
            if(err)
            {
                console.log(err);
                return false;
            }
            else
            {
                callback();
            }
        });
        db.close();
    });
};

/**************************
*
* 功能：修改
* 参数：tableName(查询的表名)、whereStr(修改条件)、updateStr(修改数据)、callback(回调函数)
*
**************************/
DBHelp.prototype.Update=function(tableName,whereStr,updateStr,callback)
{
    MongoClient.connect(DB_CONN_STR,function(err,db)
    {
        db.collection(tableName).update(whereStr,updateStr,function(err)
        {
            if(err)
            {
                console.log(err);
                return false;
            }
            else
            {
                callback();
            }
        });
        db.close();
    });
};

module.exports=DBHelp;