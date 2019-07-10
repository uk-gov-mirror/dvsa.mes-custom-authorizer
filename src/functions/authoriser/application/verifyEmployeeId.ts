import { DynamoDB } from 'aws-sdk';
import { VerifiedTokenPayload, EmployeeId } from '../application/AdJwtVerifier';
import { isEmployeeIdEmptyOrNull } from './extractEmployeeIdFromToken';

export default async function verifyEmployeeId(
  verifiedToken: VerifiedTokenPayload, employeeId: EmployeeId): Promise<boolean> {

  if (!employeeId || isEmployeeIdEmptyOrNull(employeeId)) {
    throw 'Verified Token does not have employeeId';
  }

  const ddb = createDynamoClient();
  const result = await ddb.get({
    TableName: getUsersTableName(),
    Key: {
      staffNumber: employeeId,
    },
  }).promise();

  if (!result || !result.Item) {
    return false;
  }

  return true;
}

export function createDynamoClient() {
  return process.env.IS_OFFLINE
    ? new DynamoDB.DocumentClient({ endpoint: 'http://localhost:8000' })
    : new DynamoDB.DocumentClient();
}

export function getUsersTableName(): string {
  let tableName = process.env.USERS_DDB_TABLE_NAME;
  if (tableName === undefined || tableName.length === 0) {
    console.log('No user table name set, using the default');
    tableName = 'user';
  }
  return tableName;
}
