const session = require('express-session');
const db = require('./db');

class PostgreSQLSessionStore extends session.Store {
  async get(sid, callback) {
    try {
      const result = await db.query(
        'SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()',
        [sid]
      );
      callback(null, result.rows[0] ? result.rows[0].sess : null);
    } catch (error) {
      callback(error);
    }
  }

  async set(sid, sess, callback = () => undefined) {
    try {
      const expiresAt = sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires)
        : new Date(Date.now() + 8 * 60 * 60 * 1000);
      await db.query(
        `INSERT INTO sessions (sid, sess, expire) VALUES ($1, $2, $3)
         ON CONFLICT (sid) DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
        [sid, JSON.stringify(sess), expiresAt]
      );
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async touch(sid, sess, callback = () => undefined) {
    try {
      const expiresAt = sess.cookie && sess.cookie.expires
        ? new Date(sess.cookie.expires)
        : new Date(Date.now() + 8 * 60 * 60 * 1000);
      await db.query('UPDATE sessions SET expire = $2 WHERE sid = $1', [sid, expiresAt]);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sid, callback = () => undefined) {
    try {
      await db.query('DELETE FROM sessions WHERE sid = $1', [sid]);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }
}

module.exports = PostgreSQLSessionStore;
