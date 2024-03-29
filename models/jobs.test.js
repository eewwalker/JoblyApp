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


/************************************** findAll */
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

/************************************** get */

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

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
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

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "NewTitle",
    salary: 100000000,
    equity: "0.657",
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      ...updateData,
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'j1'`);
    console.log("*****************", result)
    expect(result.rows).toEqual([{
      title: "NewTitle",
      salary: 100000000,
      equity: "0.657",
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "New",
      salary: null,
      equity: null,
    };

    let job = await Job.update("c1", updateDataSetNulls);
    expect(job).toEqual({
      ...updateDataSetNulls,
      company_handle: "c1",
    });

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
          FROM jobs
          WHERE title = 'j1'`);
    expect(result.rows).toEqual([{
      title: "New",
      salary: null,
      equity: null,
      company_handle: "c1",
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update("nope", updateData);
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("j1", {});
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("j1");
    const res = await db.query(
      "SELECT title FROM jobs WHERE title='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      throw new Error("fail test, you shouldn't get here");
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
