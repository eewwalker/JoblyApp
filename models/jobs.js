"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Given parameters of an object with filtering criteria, generates SQL query
   *  WHERE clause to filter jobs in the database.
   *
   * Receives optional filtering criteria:
   *  {title: , minSalary: , hasEquity} =>
   *  {
        setCols: 'title ILIKE $1 AND salary > $2 AND equity > $3',
        values: ["%and%", 20, 0]
      }
  */
  static _whereBuilder({ title, minSalary, hasEquity }) {
    const cols = [];
    const values = [];

    if (title !== undefined) {
      values.push(`%${title}%`);
      cols.push(`title ILIKE $${values.length}`);
    }

    if (minSalary !== undefined) {
      values.push(minSalary);
      cols.push(`salary > $${values.length}`);
    }

    if (hasEquity === true) {
      values.push(0);
      cols.push(`equity > $${values.length}`);
    }

    const where = cols.length ?
      `WHERE ${cols.join(' AND ')}` : '';

    return {
      setCols: where,
      values
    };

  }








  /** Find all companies.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

  static async findAll(filterObj = {}) {
    const { setCols, values } = this._whereBuilder(filterObj);
    const results = await db.query(`
  SELECT id,
        title,
        salary,
        equity,
        company_handle
  FROM jobs
  ${setCols}
  ORDER BY title`, values);

    return results.rows;
  }


  /** Given a job id, return data about the job
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found
  */
  static async get(id) {
    const result = await db.query(`
      SELECT id,
            title,
            salary,
            equity,
            company_handle
      FROM jobs
      WHERE id = $1`, [id]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }


  /**  Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle}
   *
   * Returns { id, title, salary, equity, company_handle}
   *
   * Throws BadRequestError if company already in database. */

  static async create({ title, salary, equity, company_handle }) {

    const result = await db.query(`
                INSERT INTO jobs (title,
                                       salary,
                                       equity,
                                       company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
                    id,
                    title,
                    salary,
                    equity,
                    company_handle`, [
      title,
      salary,
      equity,
      company_handle
    ],
    );
    const job = result.rows[0];

    return job;
  };

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data, {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `
        UPDATE jobs
        SET ${setCols}
        WHERE id = ${idVarIdx}
        RETURNING
            id,
            title,
            salary,
            equity,
            company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(`
        DELETE
        FROM jobs
        WHERE id = $1
        RETURNING id`, [id]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No job: ${id}`);
  }
}

module.exports = Job;