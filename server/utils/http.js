/* Tiện ích chung cho route */

// Bọc async handler để tự bắt lỗi -> next(err)
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Lỗi HTTP có status code + mã lỗi (khớp api-spec: { error: "CODE" })
class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

module.exports = { asyncHandler, ApiError };
