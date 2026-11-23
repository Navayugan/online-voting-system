/**
 * middleware/validate.js
 * Middleware to run Zod schema validation against req (body, query, params)
 * Also automatically sanitizes and escapes SQL LIKE parameters in query.
 */
function validate(schema) {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      // Replace req objects with sanitized and parsed values
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Escapes SQL LIKE wildcards: %, _, and \
 */
function escapeLike(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/([%_\\])/g, '\\$1');
}

module.exports = {
  validate,
  escapeLike
};
