"use strict";

const { BadRequestError } = require("../expressError");

// WHERE name ILIKE $1 AND num_employees > $2 AND num_employees < $3

// WHERE num_employees > $1 AND num_employees < $2

// {name: "sam", min: 10, max: 100} => [nameLike, min, max]
function filterCompanies(filterObj, jsToSql) {
  const keys = Object.keys(filterObj);
  if (filterObj.minEmployees > filterObj.maxEmployees){
    throw new BadRequestError("Incorrect input");
  }

// ['name ILIKE $1', 'num_employees > $2', 'num_employees < $3']
  const cols = keys.map((colName, idx) =>
  `${jsToSql[colName] || colName} $${idx + 1}`,
  );


  const values = Object.values(filterObj).map(val => {
    if (isNaN(parseInt(val))){
      return `%${val}%`;
    }
    return val;
  })

  console.log("#################", values);


  return {
    setCols: cols.length ?
    cols.join(' AND ') : true,
    values: values
  };

}

  // if (filterObj.nameLike !== undefined) {
  //   cols.push('name ILIKE $');
  //   values.push(`%${filterObj.nameLike}%`);
  // }
  // if (filterObj.minEmployees !== undefined) {
  //   cols.push('num_employees > $');
  //   values.push(parseInt(filterObj.minEmployees));
  // }
  // if (filterObj.maxEmployees !== undefined) {
  //   cols.push('num_employees < $');
  //   values.push(parseInt(filterObj.maxEmployees));
  // }







module.exports = { filterCompanies };