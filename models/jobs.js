"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Find all jobs  */
  static async findAll() {
    const results = await db.query(`
  SELECT title, salary, equity, company_handle
  FROM jobs
  ORDER BY title
   `);
    const jobs = results.rows;
    return jobs;
  }


  /** Given a job id, return data about the job
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found
  */
  static async get(title) {
    const result = await db.query(`
      SELECT title,
            salary,
            equity,
            company_handle
      FROM jobs
      WHERE title = $1`, [title]);

    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${title}`);

    return job;
  }


  /**  Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle}
   *
   * Returns { title, salary, equity, company_handle}
   *
   * Throws BadRequestError if company already in database. */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(`
    SELECT title
    FROM jobs
    WHERE title = $1`, [title]);

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate company: ${title}`);
    }

    const result = await db.query(`
                INSERT INTO jobs (title,
                                       salary,
                                       equity,
                                       company_handle)
                VALUES ($1, $2, $3, $4)
                RETURNING
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


}






module.exports = Job;;