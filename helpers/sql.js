"use strict";

const { BadRequestError } = require("../expressError");

/** Given parameters of an object with updated data and an object to map JS keys
 * to the table column names, generates SQL query components to perform updates
 * in the database.
 *
 * Returns => {
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32]
    }
*/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // {firstName: "Aliya", age: 32} => ["firstName", "age"]
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // ["firstName", "age"] => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    // '"first_name"=$1, "age"=$2'
    setCols: cols.join(", "),
    // ["Aliya", 32]
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
