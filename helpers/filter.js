"use strict";

const { BadRequestError } = require("../expressError");

/** Given parameters of an object with filtering criteria and an object to map
 * JS keys to query statements, generates SQL query components to filter
 * companies in the database.
 *
 * Receives optional filtering criteria:
 *  {nameLike: , minEmployees: , maxEmployees} =>
 *
 *  {
      setCols: 'name ILIKE $1 AND num_employees > $2 AND num_employees < $3',
      values: ["%and%", 20, 500]
    }
*/
function filterCompanies(filterObj, jsToSql) {
  const keys = Object.keys(filterObj);

  if (filterObj.minEmployees > filterObj.maxEmployees) {
    throw new BadRequestError("Incorrect input");
  }

  const cols = keys.map((colName, idx) =>
    `${jsToSql[colName] || colName} $${idx + 1}`,
  );


  const values = Object.values(filterObj).map(val => {
    if (filterObj.nameLike === val) {

      return `%${val}%`;
    }

    return val;
  });


  return {
    setCols: cols.length ?
      cols.join(' AND ') : true,
    values: values
  };

}



module.exports = { filterCompanies };