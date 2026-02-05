import jwt from 'jsonwebtoken';
import createHttpError from 'http-errors';

import User from '../models/user.js';
import Session from '../models/session.js';

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [type, token] = authHeader.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(createHttpError(401, 'Not authorized'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const session = await Session.findOne({ token });

    if (!session) {
      return next(createHttpError(401, 'Not authorized'));
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return next(createHttpError(401, 'Not authorized'));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(createHttpError(401, 'Not authorized'));
  }
};

export default authenticate;