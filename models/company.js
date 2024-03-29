"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */


class Company {

  /** Given parameters of an object with filtering criteria, generates SQL query
   *  WHERE clause to filter companies in the database.
   *
   * Receives optional filtering criteria:
   *  {nameLike: , minEmployees: , maxEmployees} =>
   *  {
        setCols: 'name ILIKE $1 AND num_employees > $2 AND num_employees < $3',
        values: ["%and%", 20, 500]
      }
  */
  static _whereBuilder({ nameLike, minEmployees, maxEmployees }) {
    const cols = [];
    const values = [];

    if (nameLike !== undefined) {
      values.push(`%${nameLike}%`);
      cols.push(`name ILIKE $${values.length}`);
    }

    if (minEmployees !== undefined) {
      values.push(minEmployees);
      cols.push(`num_employees > $${values.length}`);
    }

    if (maxEmployees !== undefined) {
      values.push(maxEmployees);
      cols.push(`num_employees < $${values.length}`);
    }

    const where = cols.length ?
      `WHERE ${cols.join(' AND ')}` : '';

    return {
      setCols: where,
      values
    };

  }


  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(`
        SELECT handle
        FROM companies
        WHERE handle = $1`, [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(`
                INSERT INTO companies (handle,
                                       name,
                                       description,
                                       num_employees,
                                       logo_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING
                    handle,
                    name,
                    description,
                    num_employees AS "numEmployees",
                    logo_url AS "logoUrl"`, [
      handle,
      name,
      description,
      numEmployees,
      logoUrl,
    ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  //{nameLike: 'sam', minEmployees: 100, maxEmployees: 500}

  //WHERE name ILIKE %nameLike%
  //num_employee > minEmployees && num_employee < maxEmployees
  //{nameLike : name , minEmployees: num_employees, maxEmployees: num_employees}

  static async findAll(filterObj = {}) {
    if (filterObj.minEmployees > filterObj.maxEmployees) {
      throw new BadRequestError("Minimum employees can not be greater than maximum employees");
    }
    const { setCols, values } = this._whereBuilder(filterObj);

    const companiesRes = await db.query(`
        SELECT handle,
               name,
               description,
               num_employees AS "numEmployees",
               logo_url      AS "logoUrl"
        FROM companies
        ${setCols}
        ORDER BY name`, values);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(`
        SELECT c.handle,
               c.name,
               c.description,
               c.num_employees AS "numEmployees",
               c.logo_url      AS "logoUrl",
               j.id,
               j.title,
               j.salary,
               j.equity,
               j.company_handle AS "companyHandle"
        FROM companies as c
        JOIN jobs AS j ON j.company_handle = c.handle
        WHERE handle = $1`, [handle]);

    const company = companyRes.rows;

    if (!company[0]) throw new NotFoundError(`No company: ${handle}`);

    const {name, description, numEmployees, logoUrl} = company[0];

    const companyData = {handle, name, description, numEmployees, logoUrl};

    const jobResults = company.map(j => {
      return {
            id: j.id,
            title: j.title,
            salary: j.salary,
            equity: j.equity,
            companyHandle: j.companyHandle
      }
    })
    companyData.jobs = jobResults

    return companyData;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE companies
        SET ${setCols}
        WHERE handle = ${handleVarIdx}
        RETURNING
            handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(`
        DELETE
        FROM companies
        WHERE handle = $1
        RETURNING handle`, [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
