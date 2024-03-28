"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


/************************************** get */
describe("findAll", function () {
  test("works: get all jobs", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        "title": "j1",
        "salary": 10000,
        "equity": "0",
        "company_handle": 'c1'
      },
      {
        "title": "j2",
        "salary": 15000,
        "equity": "0.012",
        "company_handle": 'c2'
      },
      {
        "title": "j3",
        "salary": 20000,
        "equity": "0",
        "company_handle": 'c1'
      }
    ]);
  });
});

describe("get job", function () {
  test("works: get one job", async function () {
    let jobs = await Job.get('j1');
    expect(jobs).toEqual(
      {
        "title": "j1",
        "salary": 10000,
        "equity": "0",
        "company_handle": 'c1'
      }
    );
  });
});

/************************************** post */

describe("create new job", function () {
  const newJob = {
    title: 'new',
    salary: 20000,
    equity: "0",
    company_handle: 'c1'
  };
  test("works: create new job", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
      FROM jobs
      WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        title: 'new',
        salary: 20000,
        equity: "0",
        company_handle: 'c1'
      }
    ]);
  });
  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});
