"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeystoreAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node API that is using the node's KeystoreAPI.
 *
 * **WARNING**: The KeystoreAPI is to be used by the node-owner as the data is stored locally on the node. Do not trust the root user. If you are not the node-owner, do not use this as your wallet.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class KeystoreAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/keystore" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/keystore") {
        super(core, baseURL);
        /**
         * Creates a user in the node's database.
         *
         * @param username Name of the user to create
         * @param password Password for the user
         *
         * @returns Promise for a boolean with true on success
         */
        this.createUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.createUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Exports a user. The user can be imported to another node with keystore.importUser .
         *
         * @param username The name of the user to export
         * @param password The password of the user to export
         *
         * @returns Promise with a string importable using importUser
         */
        this.exportUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.exportUser", params);
            return response.data.result.user
                ? response.data.result.user
                : response.data.result;
        });
        /**
         * Imports a user file into the node's user database and assigns it to a username.
         *
         * @param username The name the user file should be imported into
         * @param user cb58 serialized string represetning a user"s data
         * @param password The user"s password
         *
         * @returns A promise with a true-value on success.
         */
        this.importUser = (username, user, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                user,
                password
            };
            const response = yield this.callMethod("keystore.importUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
        /**
         * Lists the names of all users on the node.
         *
         * @returns Promise of an array with all user names.
         */
        this.listUsers = () => __awaiter(this, void 0, void 0, function* () {
            const response = yield this.callMethod("keystore.listUsers");
            return response.data.result.users;
        });
        /**
         * Deletes a user in the node's database.
         *
         * @param username Name of the user to delete
         * @param password Password for the user
         *
         * @returns Promise for a boolean with true on success
         */
        this.deleteUser = (username, password) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                username,
                password
            };
            const response = yield this.callMethod("keystore.deleteUser", params);
            return response.data.result.success
                ? response.data.result.success
                : response.data.result;
        });
    }
}
exports.KeystoreAPI = KeystoreAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMva2V5c3RvcmUvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQUs5Qzs7Ozs7Ozs7R0FRRztBQUNILE1BQWEsV0FBWSxTQUFRLGlCQUFPO0lBMkd0Qzs7Ozs7T0FLRztJQUNILFlBQVksSUFBYyxFQUFFLFVBQWtCLGVBQWU7UUFDM0QsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQTtRQWpIdEI7Ozs7Ozs7V0FPRztRQUNILGVBQVUsR0FBRyxDQUFPLFFBQWdCLEVBQUUsUUFBZ0IsRUFBb0IsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFFBQVE7Z0JBQ1IsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsZUFBVSxHQUFHLENBQU8sUUFBZ0IsRUFBRSxRQUFnQixFQUFtQixFQUFFO1lBQ3pFLE1BQU0sTUFBTSxHQUFtQjtnQkFDN0IsUUFBUTtnQkFDUixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSTtnQkFDOUIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7Z0JBQzNCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsZUFBVSxHQUFHLENBQ1gsUUFBZ0IsRUFDaEIsSUFBWSxFQUNaLFFBQWdCLEVBQ0UsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBcUI7Z0JBQy9CLFFBQVE7Z0JBQ1IsSUFBSTtnQkFDSixRQUFRO2FBQ1QsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELHFCQUFxQixFQUNyQixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTztnQkFDakMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQzlCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7O1dBSUc7UUFDSCxjQUFTLEdBQUcsR0FBNEIsRUFBRTtZQUN4QyxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxvQkFBb0IsQ0FDckIsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFBO1FBQ25DLENBQUMsQ0FBQSxDQUFBO1FBRUQ7Ozs7Ozs7V0FPRztRQUNILGVBQVUsR0FBRyxDQUFPLFFBQWdCLEVBQUUsUUFBZ0IsRUFBb0IsRUFBRTtZQUMxRSxNQUFNLE1BQU0sR0FBbUI7Z0JBQzdCLFFBQVE7Z0JBQ1IsUUFBUTthQUNULENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87Z0JBQ2pDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPO2dCQUM5QixDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7UUFDMUIsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUFwSEQsa0NBb0hDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUtleXN0b3JlXG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vLi4vYXhpYVwiXG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9qcnBjYXBpXCJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxuaW1wb3J0IHsgSW1wb3J0VXNlclBhcmFtcyB9IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuaW1wb3J0IHsgQ3JlZHNJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2ludGVyZmFjZXNcIlxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSBBUEkgdGhhdCBpcyB1c2luZyB0aGUgbm9kZSdzIEtleXN0b3JlQVBJLlxuICpcbiAqICoqV0FSTklORyoqOiBUaGUgS2V5c3RvcmVBUEkgaXMgdG8gYmUgdXNlZCBieSB0aGUgbm9kZS1vd25lciBhcyB0aGUgZGF0YSBpcyBzdG9yZWQgbG9jYWxseSBvbiB0aGUgbm9kZS4gRG8gbm90IHRydXN0IHRoZSByb290IHVzZXIuIElmIHlvdSBhcmUgbm90IHRoZSBub2RlLW93bmVyLCBkbyBub3QgdXNlIHRoaXMgYXMgeW91ciB3YWxsZXQuXG4gKlxuICogQGNhdGVnb3J5IFJQQ0FQSXNcbiAqXG4gKiBAcmVtYXJrcyBUaGlzIGV4dGVuZHMgdGhlIFtbSlJQQ0FQSV1dIGNsYXNzLiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgZGlyZWN0bHkgY2FsbGVkLiBJbnN0ZWFkLCB1c2UgdGhlIFtbQXhpYS5hZGRBUEldXSBmdW5jdGlvbiB0byByZWdpc3RlciB0aGlzIGludGVyZmFjZSB3aXRoIEF4aWEuXG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlzdG9yZUFQSSBleHRlbmRzIEpSUENBUEkge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIHVzZXIgaW4gdGhlIG5vZGUncyBkYXRhYmFzZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIE5hbWUgb2YgdGhlIHVzZXIgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZCBmb3IgdGhlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHdpdGggdHJ1ZSBvbiBzdWNjZXNzXG4gICAqL1xuICBjcmVhdGVVc2VyID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWRzSW50ZXJmYWNlID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwia2V5c3RvcmUuY3JlYXRlVXNlclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvcnRzIGEgdXNlci4gVGhlIHVzZXIgY2FuIGJlIGltcG9ydGVkIHRvIGFub3RoZXIgbm9kZSB3aXRoIGtleXN0b3JlLmltcG9ydFVzZXIgLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgb2YgdGhlIHVzZXIgdG8gZXhwb3J0XG4gICAqIEBwYXJhbSBwYXNzd29yZCBUaGUgcGFzc3dvcmQgb2YgdGhlIHVzZXIgdG8gZXhwb3J0XG4gICAqXG4gICAqIEByZXR1cm5zIFByb21pc2Ugd2l0aCBhIHN0cmluZyBpbXBvcnRhYmxlIHVzaW5nIGltcG9ydFVzZXJcbiAgICovXG4gIGV4cG9ydFVzZXIgPSBhc3luYyAodXNlcm5hbWU6IHN0cmluZywgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBDcmVkc0ludGVyZmFjZSA9IHtcbiAgICAgIHVzZXJuYW1lLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImtleXN0b3JlLmV4cG9ydFVzZXJcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQudXNlclxuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC51c2VyXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogSW1wb3J0cyBhIHVzZXIgZmlsZSBpbnRvIHRoZSBub2RlJ3MgdXNlciBkYXRhYmFzZSBhbmQgYXNzaWducyBpdCB0byBhIHVzZXJuYW1lLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcm5hbWUgVGhlIG5hbWUgdGhlIHVzZXIgZmlsZSBzaG91bGQgYmUgaW1wb3J0ZWQgaW50b1xuICAgKiBAcGFyYW0gdXNlciBjYjU4IHNlcmlhbGl6ZWQgc3RyaW5nIHJlcHJlc2V0bmluZyBhIHVzZXJcInMgZGF0YVxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhlIHVzZXJcInMgcGFzc3dvcmRcbiAgICpcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHdpdGggYSB0cnVlLXZhbHVlIG9uIHN1Y2Nlc3MuXG4gICAqL1xuICBpbXBvcnRVc2VyID0gYXN5bmMgKFxuICAgIHVzZXJuYW1lOiBzdHJpbmcsXG4gICAgdXNlcjogc3RyaW5nLFxuICAgIHBhc3N3b3JkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBJbXBvcnRVc2VyUGFyYW1zID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICB1c2VyLFxuICAgICAgcGFzc3dvcmRcbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImtleXN0b3JlLmltcG9ydFVzZXJcIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xuICAgICAgPyByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgdGhlIG5hbWVzIG9mIGFsbCB1c2VycyBvbiB0aGUgbm9kZS5cbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBvZiBhbiBhcnJheSB3aXRoIGFsbCB1c2VyIG5hbWVzLlxuICAgKi9cbiAgbGlzdFVzZXJzID0gYXN5bmMgKCk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwia2V5c3RvcmUubGlzdFVzZXJzXCJcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnVzZXJzXG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlcyBhIHVzZXIgaW4gdGhlIG5vZGUncyBkYXRhYmFzZS5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJuYW1lIE5hbWUgb2YgdGhlIHVzZXIgdG8gZGVsZXRlXG4gICAqIEBwYXJhbSBwYXNzd29yZCBQYXNzd29yZCBmb3IgdGhlIHVzZXJcbiAgICpcbiAgICogQHJldHVybnMgUHJvbWlzZSBmb3IgYSBib29sZWFuIHdpdGggdHJ1ZSBvbiBzdWNjZXNzXG4gICAqL1xuICBkZWxldGVVc2VyID0gYXN5bmMgKHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcbiAgICBjb25zdCBwYXJhbXM6IENyZWRzSW50ZXJmYWNlID0ge1xuICAgICAgdXNlcm5hbWUsXG4gICAgICBwYXNzd29yZFxuICAgIH1cbiAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgIFwia2V5c3RvcmUuZGVsZXRlVXNlclwiLFxuICAgICAgcGFyYW1zXG4gICAgKVxuICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdC5zdWNjZXNzXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgICAgIDogcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tBeGlhLmFkZEFQSV1dIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF4aWEgY2xhc3NcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQva2V5c3RvcmVcIiBhcyB0aGUgcGF0aCB0byBycGMncyBiYXNlVVJMXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb3JlOiBBeGlhQ29yZSwgYmFzZVVSTDogc3RyaW5nID0gXCIvZXh0L2tleXN0b3JlXCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICB9XG59XG4iXX0=