"use strict";

const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  test("works: updates info for database", function () {
    const dataToUpdate = {firstName: "Aliya", age: 32};
    const jsToSql = {firstName: "first_name"};

    const results = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(results).toEqual({
      setCols: '"first_name"=$1, "age"=$2',
      values: ["Aliya", 32]
    });
  })

  test("fails: received no data to update", function () {
    const dataToUpdate = {};
    const jsToSql = {firstName: "first_name"};

    expect(() => sqlForPartialUpdate(dataToUpdate, jsToSql))
    .toThrow(BadRequestError);;
  })
})

