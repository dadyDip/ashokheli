import jwt from "jsonwebtoken";

export function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "NO_TOKEN" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 ATTACH USER TO REQUEST
    req.user = {
      id: decoded.id || decoded._id,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "INVALID_TOKEN" });
  }
}
