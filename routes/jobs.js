
"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/jobs");

const jobNewSchema = require("../schemas/jobNew.json");
const jobFilterSchema = require("../schemas/jobFilter.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: admin
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  const validator = jsonschema.validate(
    req.body,
    jobNewSchema,
    { required: true }
  );
  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const job = await Job.create(req.body);
  return res.status(201).json({ job });
});

/** GET /  =>
 *   { companies: [ { title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title
 * - minSalary
 * - hasEquity (if true, filter jobs that provide a non-zero amount of equity.
 * If false or not included in the filtering, list all jobs regardless of equity)
 *
 * Authorization required: none
 */

router.get("/", async function (req, res, next) {
  let data = req.query;

  if (data.minSalary) {
    data.minSalary = Number(data.minSalary);
  }
  if (data.hasEquity === 'true') {
    data.hasEquity = true;
  }
  if (data.hasEquity === 'false') {
    data.hasEquity = false;
  }

  const validator = jsonschema.validate(
    data,
    jobFilterSchema,
    { required: true }
  );

  if (!validator.valid) {
    const errs = validator.errors.map(e => e.stack);
    throw new BadRequestError(errs);
  }

  const jobs = await Job.findAll(data);

  return res.json({ jobs });
});

/** GET /[id]  =>  { job }
 *
 *  Job is {  title, salary, equity, company_handle }
 *
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
  const job = await Job.get(req.params.id);

  return res.json({ job });
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: {title, salary, equity }
 *
 * Returns { id, title, salary, equity, company_handle}
 *
 * Authorization required: admin
 */

router.patch("/:id",
  ensureAdmin,
  async function (req, res, next) {
    const validator = jsonschema.validate(
      req.body,
      jobUpdateSchema,
      { required: true }
    );
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Job.update(req.params.id, req.body);
    return res.json({ job });
  });

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete("/:id",
  ensureAdmin,
  async function (req, res, next) {
    await Job.remove(req.params.id);
    return res.json({ deleted: req.params.id });
  });


module.exports = router;
