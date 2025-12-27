export type JwtPayload = {
  sub: string;
  email: string;
  orgId: string;
  role: 'ORG_ADMIN' | 'ORG_USER' | 'READ_ONLY';
};
