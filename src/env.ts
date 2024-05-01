export const port = process.env.PORT || '8080';
export const jwtSecret = process.env.JWT_SECRET || 'secret'
export const jwtDuration = Number.parseInt(process.env.JWT_DURATION || '3600')
