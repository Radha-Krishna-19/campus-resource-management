// Generic zod-schema validator: rejects malformed input with 400 before it
// ever reaches a controller/Mongo query, instead of the previous ad-hoc
// per-controller truthiness checks.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      });
    }
    req.body = result.data;
    next();
  };
}

module.exports = validate;
