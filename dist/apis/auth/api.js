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
exports.AuthAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's AuthAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class AuthAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]]
     * method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/auth" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/auth") {
        super(core, baseURL);
        /**
         * Creates a new authorization token that grants access to one or more API endpoints.
         *
         * @param password This node's authorization token password, set through the CLI when the node was launched.
         * @param endpoints A list of endpoints that will be accessible using the generated token. If there"s an element that is "*", this token can reach any endpoint.
         *
         * @returns Returns a Promise string containing the authorization token.
         */
        this.newToken = (password, endpoints) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                password,
                endpoints
            };
            const response = yield this.callMethod("auth.newToken", params);
            return response.data.result.token
                ? response.data.result.token
                : response.data.result;
        });
        /**
         * Revokes an authorization token, removing all of its rights to access endpoints.
         *
         * @param password This node's authorization token password, set through the CLI when the node was launched.
         * @param token An authorization token whose access should be revoked.
         *
         * @returns Returns a Promise boolean indicating if a token was successfully revoked.
         */
        this.revokeToken = (password, token) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                password,
                token
            };
            const response = yield this.callMethod("auth.revokeToken", params);
            return response.data.result.success;
        });
        /**
         * Change this node's authorization token password. **Any authorization tokens created under an old password will become invalid.**
         *
         * @param oldPassword This node's authorization token password, set through the CLI when the node was launched.
         * @param newPassword A new password for this node's authorization token issuance.
         *
         * @returns Returns a Promise boolean indicating if the password was successfully changed.
         */
        this.changePassword = (oldPassword, newPassword) => __awaiter(this, void 0, void 0, function* () {
            const params = {
                oldPassword,
                newPassword
            };
            const response = yield this.callMethod("auth.changePassword", params);
            return response.data.result.success;
        });
    }
}
exports.AuthAPI = AuthAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXV0aC9hcGkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBS0Esa0RBQThDO0FBUzlDOzs7Ozs7R0FNRztBQUNILE1BQWEsT0FBUSxTQUFRLGlCQUFPO0lBcUVsQzs7Ozs7O09BTUc7SUFDSCxZQUFZLElBQWMsRUFBRSxVQUFrQixXQUFXO1FBQ3ZELEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUE1RXRCOzs7Ozs7O1dBT0c7UUFDSCxhQUFRLEdBQUcsQ0FDVCxRQUFnQixFQUNoQixTQUFtQixFQUNvQixFQUFFO1lBQ3pDLE1BQU0sTUFBTSxHQUFzQjtnQkFDaEMsUUFBUTtnQkFDUixTQUFTO2FBQ1YsQ0FBQTtZQUNELE1BQU0sUUFBUSxHQUF3QixNQUFNLElBQUksQ0FBQyxVQUFVLENBQ3pELGVBQWUsRUFDZixNQUFNLENBQ1AsQ0FBQTtZQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSztnQkFDL0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUs7Z0JBQzVCLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTtRQUMxQixDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7O1dBT0c7UUFDSCxnQkFBVyxHQUFHLENBQU8sUUFBZ0IsRUFBRSxLQUFhLEVBQW9CLEVBQUU7WUFDeEUsTUFBTSxNQUFNLEdBQXlCO2dCQUNuQyxRQUFRO2dCQUNSLEtBQUs7YUFDTixDQUFBO1lBQ0QsTUFBTSxRQUFRLEdBQXdCLE1BQU0sSUFBSSxDQUFDLFVBQVUsQ0FDekQsa0JBQWtCLEVBQ2xCLE1BQU0sQ0FDUCxDQUFBO1lBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUE7UUFDckMsQ0FBQyxDQUFBLENBQUE7UUFFRDs7Ozs7OztXQU9HO1FBQ0gsbUJBQWMsR0FBRyxDQUNmLFdBQW1CLEVBQ25CLFdBQW1CLEVBQ0QsRUFBRTtZQUNwQixNQUFNLE1BQU0sR0FBNEI7Z0JBQ3RDLFdBQVc7Z0JBQ1gsV0FBVzthQUNaLENBQUE7WUFDRCxNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCxxQkFBcUIsRUFDckIsTUFBTSxDQUNQLENBQUE7WUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQTtRQUNyQyxDQUFDLENBQUEsQ0FBQTtJQVdELENBQUM7Q0FDRjtBQS9FRCwwQkErRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBwYWNrYWdlRG9jdW1lbnRhdGlvblxuICogQG1vZHVsZSBBUEktQXV0aFxuICovXG5pbXBvcnQgQXhpYUNvcmUgZnJvbSBcIi4uLy4uL2F4aWFcIlxuaW1wb3J0IHsgSlJQQ0FQSSB9IGZyb20gXCIuLi8uLi9jb21tb24vanJwY2FwaVwiXG5pbXBvcnQgeyBSZXF1ZXN0UmVzcG9uc2VEYXRhIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9hcGliYXNlXCJcbmltcG9ydCB7IEVycm9yUmVzcG9uc2VPYmplY3QgfSBmcm9tIFwiLi4vLi4vdXRpbHMvZXJyb3JzXCJcbmltcG9ydCB7XG4gIENoYW5nZVBhc3N3b3JkSW50ZXJmYWNlLFxuICBOZXdUb2tlbkludGVyZmFjZSxcbiAgUmV2b2tlVG9rZW5JbnRlcmZhY2Vcbn0gZnJvbSBcIi4vaW50ZXJmYWNlc1wiXG5cbi8qKlxuICogQ2xhc3MgZm9yIGludGVyYWN0aW5nIHdpdGggYSBub2RlJ3MgQXV0aEFQSS5cbiAqXG4gKiBAY2F0ZWdvcnkgUlBDQVBJc1xuICpcbiAqIEByZW1hcmtzIFRoaXMgZXh0ZW5kcyB0aGUgW1tKUlBDQVBJXV0gY2xhc3MuIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBkaXJlY3RseSBjYWxsZWQuIEluc3RlYWQsIHVzZSB0aGUgW1tBeGlhLmFkZEFQSV1dIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIHRoaXMgaW50ZXJmYWNlIHdpdGggQXhpYS5cbiAqL1xuZXhwb3J0IGNsYXNzIEF1dGhBUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgYXV0aG9yaXphdGlvbiB0b2tlbiB0aGF0IGdyYW50cyBhY2Nlc3MgdG8gb25lIG9yIG1vcmUgQVBJIGVuZHBvaW50cy5cbiAgICpcbiAgICogQHBhcmFtIHBhc3N3b3JkIFRoaXMgbm9kZSdzIGF1dGhvcml6YXRpb24gdG9rZW4gcGFzc3dvcmQsIHNldCB0aHJvdWdoIHRoZSBDTEkgd2hlbiB0aGUgbm9kZSB3YXMgbGF1bmNoZWQuXG4gICAqIEBwYXJhbSBlbmRwb2ludHMgQSBsaXN0IG9mIGVuZHBvaW50cyB0aGF0IHdpbGwgYmUgYWNjZXNzaWJsZSB1c2luZyB0aGUgZ2VuZXJhdGVkIHRva2VuLiBJZiB0aGVyZVwicyBhbiBlbGVtZW50IHRoYXQgaXMgXCIqXCIsIHRoaXMgdG9rZW4gY2FuIHJlYWNoIGFueSBlbmRwb2ludC5cbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2Ugc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGF1dGhvcml6YXRpb24gdG9rZW4uXG4gICAqL1xuICBuZXdUb2tlbiA9IGFzeW5jIChcbiAgICBwYXNzd29yZDogc3RyaW5nLFxuICAgIGVuZHBvaW50czogc3RyaW5nW11cbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBFcnJvclJlc3BvbnNlT2JqZWN0PiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBOZXdUb2tlbkludGVyZmFjZSA9IHtcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgZW5kcG9pbnRzXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdXRoLm5ld1Rva2VuXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnRva2VuXG4gICAgICA/IHJlc3BvbnNlLmRhdGEucmVzdWx0LnRva2VuXG4gICAgICA6IHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlcyBhbiBhdXRob3JpemF0aW9uIHRva2VuLCByZW1vdmluZyBhbGwgb2YgaXRzIHJpZ2h0cyB0byBhY2Nlc3MgZW5kcG9pbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gcGFzc3dvcmQgVGhpcyBub2RlJ3MgYXV0aG9yaXphdGlvbiB0b2tlbiBwYXNzd29yZCwgc2V0IHRocm91Z2ggdGhlIENMSSB3aGVuIHRoZSBub2RlIHdhcyBsYXVuY2hlZC5cbiAgICogQHBhcmFtIHRva2VuIEFuIGF1dGhvcml6YXRpb24gdG9rZW4gd2hvc2UgYWNjZXNzIHNob3VsZCBiZSByZXZva2VkLlxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBib29sZWFuIGluZGljYXRpbmcgaWYgYSB0b2tlbiB3YXMgc3VjY2Vzc2Z1bGx5IHJldm9rZWQuXG4gICAqL1xuICByZXZva2VUb2tlbiA9IGFzeW5jIChwYXNzd29yZDogc3RyaW5nLCB0b2tlbjogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiA9PiB7XG4gICAgY29uc3QgcGFyYW1zOiBSZXZva2VUb2tlbkludGVyZmFjZSA9IHtcbiAgICAgIHBhc3N3b3JkLFxuICAgICAgdG9rZW5cbiAgICB9XG4gICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICBcImF1dGgucmV2b2tlVG9rZW5cIixcbiAgICAgIHBhcmFtc1xuICAgIClcbiAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuc3VjY2Vzc1xuICB9XG5cbiAgLyoqXG4gICAqIENoYW5nZSB0aGlzIG5vZGUncyBhdXRob3JpemF0aW9uIHRva2VuIHBhc3N3b3JkLiAqKkFueSBhdXRob3JpemF0aW9uIHRva2VucyBjcmVhdGVkIHVuZGVyIGFuIG9sZCBwYXNzd29yZCB3aWxsIGJlY29tZSBpbnZhbGlkLioqXG4gICAqXG4gICAqIEBwYXJhbSBvbGRQYXNzd29yZCBUaGlzIG5vZGUncyBhdXRob3JpemF0aW9uIHRva2VuIHBhc3N3b3JkLCBzZXQgdGhyb3VnaCB0aGUgQ0xJIHdoZW4gdGhlIG5vZGUgd2FzIGxhdW5jaGVkLlxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgQSBuZXcgcGFzc3dvcmQgZm9yIHRoaXMgbm9kZSdzIGF1dGhvcml6YXRpb24gdG9rZW4gaXNzdWFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIGJvb2xlYW4gaW5kaWNhdGluZyBpZiB0aGUgcGFzc3dvcmQgd2FzIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkLlxuICAgKi9cbiAgY2hhbmdlUGFzc3dvcmQgPSBhc3luYyAoXG4gICAgb2xkUGFzc3dvcmQ6IHN0cmluZyxcbiAgICBuZXdQYXNzd29yZDogc3RyaW5nXG4gICk6IFByb21pc2U8Ym9vbGVhbj4gPT4ge1xuICAgIGNvbnN0IHBhcmFtczogQ2hhbmdlUGFzc3dvcmRJbnRlcmZhY2UgPSB7XG4gICAgICBvbGRQYXNzd29yZCxcbiAgICAgIG5ld1Bhc3N3b3JkXG4gICAgfVxuICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgXCJhdXRoLmNoYW5nZVBhc3N3b3JkXCIsXG4gICAgICBwYXJhbXNcbiAgICApXG4gICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0LnN1Y2Nlc3NcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGlzIGNsYXNzIHNob3VsZCBub3QgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5LiBJbnN0ZWFkIHVzZSB0aGUgW1tBeGlhLmFkZEFQSV1dXG4gICAqIG1ldGhvZC5cbiAgICpcbiAgICogQHBhcmFtIGNvcmUgQSByZWZlcmVuY2UgdG8gdGhlIEF4aWEgY2xhc3NcbiAgICogQHBhcmFtIGJhc2VVUkwgRGVmYXVsdHMgdG8gdGhlIHN0cmluZyBcIi9leHQvYXV0aFwiIGFzIHRoZSBwYXRoIHRvIHJwYydzIGJhc2VVUkxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvcmU6IEF4aWFDb3JlLCBiYXNlVVJMOiBzdHJpbmcgPSBcIi9leHQvYXV0aFwiKSB7XG4gICAgc3VwZXIoY29yZSwgYmFzZVVSTClcbiAgfVxufVxuIl19