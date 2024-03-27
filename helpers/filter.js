"use strict";

const { BadRequestError } = require("../expressError");


function filterCompanies(filterObj) {
  const cols = [];
  const values = [];

  // const cols = keys.map((colName, idx) =>
  //   `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  // );

  

  if (filterObj.nameLike !== undefined) {
    cols.push('name ILIKE $');
    values.push(`%${filterObj.nameLike}%`);
  }
  if (filterObj.minEmployees !== undefined) {
    cols.push('num_employees > $');
    values.push(parseInt(filterObj.minEmployees));
  }
  if (filterObj.maxEmployees !== undefined) {
    cols.push('num_employees < $');
    values.push(parseInt(filterObj.maxEmployees));
  }

  return {
    where: cols.length ? cols.join('AND') : '1',
    values: values
  };

}









module.exports = { filterCompanies };