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
exports.IndexAPI = void 0;
const jrpcapi_1 = require("../../common/jrpcapi");
/**
 * Class for interacting with a node's IndexAPI.
 *
 * @category RPCAPIs
 *
 * @remarks This extends the [[JRPCAPI]] class. This class should not be directly called. Instead, use the [[Axia.addAPI]] function to register this interface with Axia.
 */
class IndexAPI extends jrpcapi_1.JRPCAPI {
    /**
     * This class should not be instantiated directly. Instead use the [[Axia.addAPI]] method.
     *
     * @param core A reference to the Axia class
     * @param baseURL Defaults to the string "/ext/index/Swap/tx" as the path to rpc's baseURL
     */
    constructor(core, baseURL = "/ext/index/Swap/tx") {
        super(core, baseURL);
        /**
         * Get last accepted tx, vtx or block
         *
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetLastAcceptedResponse.
         */
        this.getLastAccepted = (encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                encoding
            };
            try {
                const response = yield this.callMethod("index.getLastAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container by index
         *
         * @param index
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIndexResponse.
         */
        this.getContainerByIndex = (index = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                index,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByIndex", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get contrainer by ID
         *
         * @param containerID
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerByIDResponse.
         */
        this.getContainerByID = (containerID = "0", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                containerID,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerByID", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get container range
         *
         * @param startIndex
         * @param numToFetch
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetContainerRangeResponse.
         */
        this.getContainerRange = (startIndex = 0, numToFetch = 100, encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                startIndex,
                numToFetch,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getContainerRange", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Get index by containerID
         *
         * @param containerID
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIndexResponse.
         */
        this.getIndex = (containerID = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                containerID,
                encoding
            };
            try {
                const response = yield this.callMethod("index.getIndex", params);
                return response.data.result.index;
            }
            catch (error) {
                console.log(error);
            }
        });
        /**
         * Check if container is accepted
         *
         * @param containerID
         * @param encoding
         * @param baseURL
         *
         * @returns Returns a Promise GetIsAcceptedResponse.
         */
        this.isAccepted = (containerID = "", encoding = "hex", baseURL = this.getBaseURL()) => __awaiter(this, void 0, void 0, function* () {
            this.setBaseURL(baseURL);
            const params = {
                containerID,
                encoding
            };
            try {
                const response = yield this.callMethod("index.isAccepted", params);
                return response.data.result;
            }
            catch (error) {
                console.log(error);
            }
        });
    }
}
exports.IndexAPI = IndexAPI;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvaW5kZXgvYXBpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQUtBLGtEQUE4QztBQWdCOUM7Ozs7OztHQU1HO0FBQ0gsTUFBYSxRQUFTLFNBQVEsaUJBQU87SUEyTG5DOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUFjLEVBQUUsVUFBa0Isb0JBQW9CO1FBQ2hFLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUE7UUFqTXRCOzs7Ozs7O1dBT0c7UUFDSCxvQkFBZSxHQUFHLENBQ2hCLFdBQW1CLEtBQUssRUFDeEIsVUFBa0IsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUNELEVBQUU7WUFDcEMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQTtZQUN4QixNQUFNLE1BQU0sR0FBMEI7Z0JBQ3BDLFFBQVE7YUFDVCxDQUFBO1lBRUQsSUFBSTtnQkFDRixNQUFNLFFBQVEsR0FBd0IsTUFBTSxJQUFJLENBQUMsVUFBVSxDQUN6RCx1QkFBdUIsRUFDdkIsTUFBTSxDQUNQLENBQUE7Z0JBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQTthQUM1QjtZQUFDLE9BQU8sS0FBSyxFQUFFO2dCQUNkLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7YUFDbkI7UUFDSCxDQUFDLENBQUEsQ0FBQTtRQUVEOzs7Ozs7OztXQVFHO1FBQ0gsd0JBQW1CLEdBQUcsQ0FDcEIsUUFBZ0IsR0FBRyxFQUNuQixXQUFtQixLQUFLLEVBQ3hCLFVBQWtCLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFDRyxFQUFFO1lBQ3hDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUE7WUFDeEIsTUFBTSxNQUFNLEdBQThCO2dCQUN4QyxLQUFLO2dCQUNMLFFBQVE7YUFDVCxDQUFBO1lBRUQsSUFBSTtnQkFDRixNQUFNLFFB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O2dCQUNELE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUE7YUFDNUI7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO2FBQ25CO1FBQ0gsQ0FBQyxDQUFBLENBQUE7SUFVRCxDQUFDO0NBQ0Y7QUFwTUQsNEJBb01DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUluZGV4XG4gKi9cbmltcG9ydCBBeGlhQ29yZSBmcm9tIFwiLi4vLi4vYXhpYVwiXG5pbXBvcnQgeyBKUlBDQVBJIH0gZnJvbSBcIi4uLy4uL2NvbW1vbi9qcnBjYXBpXCJcbmltcG9ydCB7IFJlcXVlc3RSZXNwb25zZURhdGEgfSBmcm9tIFwiLi4vLi4vY29tbW9uL2FwaWJhc2VcIlxuaW1wb3J0IHtcbiAgR2V0TGFzdEFjY2VwdGVkUGFyYW1zLFxuICBHZXRMYXN0QWNjZXB0ZWRSZXNwb25zZSxcbiAgR2V0Q29udGFpbmVyQnlJbmRleFBhcmFtcyxcbiAgR2V0Q29udGFpbmVyQnlJbmRleFJlc3BvbnNlLFxuICBHZXRDb250YWluZXJCeUlEUGFyYW1zLFxuICBHZXRDb250YWluZXJCeUlEUmVzcG9uc2UsXG4gIEdldENvbnRhaW5lclJhbmdlUGFyYW1zLFxuICBHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlLFxuICBHZXRJbmRleFBhcmFtcyxcbiAgR2V0SXNBY2NlcHRlZFBhcmFtcyxcbiAgSXNBY2NlcHRlZFJlc3BvbnNlXG59IGZyb20gXCIuL2ludGVyZmFjZXNcIlxuXG4vKipcbiAqIENsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIGEgbm9kZSdzIEluZGV4QVBJLlxuICpcbiAqIEBjYXRlZ29yeSBSUENBUElzXG4gKlxuICogQHJlbWFya3MgVGhpcyBleHRlbmRzIHRoZSBbW0pSUENBUEldXSBjbGFzcy4gVGhpcyBjbGFzcyBzaG91bGQgbm90IGJlIGRpcmVjdGx5IGNhbGxlZC4gSW5zdGVhZCwgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gZnVuY3Rpb24gdG8gcmVnaXN0ZXIgdGhpcyBpbnRlcmZhY2Ugd2l0aCBBeGlhLlxuICovXG5leHBvcnQgY2xhc3MgSW5kZXhBUEkgZXh0ZW5kcyBKUlBDQVBJIHtcbiAgLyoqXG4gICAqIEdldCBsYXN0IGFjY2VwdGVkIHR4LCB2dHggb3IgYmxvY2tcbiAgICpcbiAgICogQHBhcmFtIGVuY29kaW5nXG4gICAqIEBwYXJhbSBiYXNlVVJMXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldExhc3RBY2NlcHRlZFJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0TGFzdEFjY2VwdGVkID0gYXN5bmMgKFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8R2V0TGFzdEFjY2VwdGVkUmVzcG9uc2U+ID0+IHtcbiAgICB0aGlzLnNldEJhc2VVUkwoYmFzZVVSTClcbiAgICBjb25zdCBwYXJhbXM6IEdldExhc3RBY2NlcHRlZFBhcmFtcyA9IHtcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgICBcImluZGV4LmdldExhc3RBY2NlcHRlZFwiLFxuICAgICAgICBwYXJhbXNcbiAgICAgIClcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNvbnRhaW5lciBieSBpbmRleFxuICAgKlxuICAgKiBAcGFyYW0gaW5kZXhcbiAgICogQHBhcmFtIGVuY29kaW5nXG4gICAqIEBwYXJhbSBiYXNlVVJMXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldENvbnRhaW5lckJ5SW5kZXhSZXNwb25zZS5cbiAgICovXG4gIGdldENvbnRhaW5lckJ5SW5kZXggPSBhc3luYyAoXG4gICAgaW5kZXg6IHN0cmluZyA9IFwiMFwiLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8R2V0Q29udGFpbmVyQnlJbmRleFJlc3BvbnNlPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRDb250YWluZXJCeUluZGV4UGFyYW1zID0ge1xuICAgICAgaW5kZXgsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgICAgXCJpbmRleC5nZXRDb250YWluZXJCeUluZGV4XCIsXG4gICAgICAgIHBhcmFtc1xuICAgICAgKVxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29udHJhaW5lciBieSBJRFxuICAgKlxuICAgKiBAcGFyYW0gY29udGFpbmVySURcbiAgICogQHBhcmFtIGVuY29kaW5nXG4gICAqIEBwYXJhbSBiYXNlVVJMXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldENvbnRhaW5lckJ5SURSZXNwb25zZS5cbiAgICovXG4gIGdldENvbnRhaW5lckJ5SUQgPSBhc3luYyAoXG4gICAgY29udGFpbmVySUQ6IHN0cmluZyA9IFwiMFwiLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8R2V0Q29udGFpbmVyQnlJRFJlc3BvbnNlPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRDb250YWluZXJCeUlEUGFyYW1zID0ge1xuICAgICAgY29udGFpbmVySUQsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgICAgXCJpbmRleC5nZXRDb250YWluZXJCeUlEXCIsXG4gICAgICAgIHBhcmFtc1xuICAgICAgKVxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEucmVzdWx0XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgY29udGFpbmVyIHJhbmdlXG4gICAqXG4gICAqIEBwYXJhbSBzdGFydEluZGV4XG4gICAqIEBwYXJhbSBudW1Ub0ZldGNoXG4gICAqIEBwYXJhbSBlbmNvZGluZ1xuICAgKiBAcGFyYW0gYmFzZVVSTFxuICAgKlxuICAgKiBAcmV0dXJucyBSZXR1cm5zIGEgUHJvbWlzZSBHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlLlxuICAgKi9cbiAgZ2V0Q29udGFpbmVyUmFuZ2UgPSBhc3luYyAoXG4gICAgc3RhcnRJbmRleDogbnVtYmVyID0gMCxcbiAgICBudW1Ub0ZldGNoOiBudW1iZXIgPSAxMDAsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCIsXG4gICAgYmFzZVVSTDogc3RyaW5nID0gdGhpcy5nZXRCYXNlVVJMKClcbiAgKTogUHJvbWlzZTxHZXRDb250YWluZXJSYW5nZVJlc3BvbnNlW10+ID0+IHtcbiAgICB0aGlzLnNldEJhc2VVUkwoYmFzZVVSTClcbiAgICBjb25zdCBwYXJhbXM6IEdldENvbnRhaW5lclJhbmdlUGFyYW1zID0ge1xuICAgICAgc3RhcnRJbmRleCxcbiAgICAgIG51bVRvRmV0Y2gsXG4gICAgICBlbmNvZGluZ1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCByZXNwb25zZTogUmVxdWVzdFJlc3BvbnNlRGF0YSA9IGF3YWl0IHRoaXMuY2FsbE1ldGhvZChcbiAgICAgICAgXCJpbmRleC5nZXRDb250YWluZXJSYW5nZVwiLFxuICAgICAgICBwYXJhbXNcbiAgICAgIClcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLnJlc3VsdFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcilcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogR2V0IGluZGV4IGJ5IGNvbnRhaW5lcklEXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWluZXJJRFxuICAgKiBAcGFyYW0gZW5jb2RpbmdcbiAgICogQHBhcmFtIGJhc2VVUkxcbiAgICpcbiAgICogQHJldHVybnMgUmV0dXJucyBhIFByb21pc2UgR2V0SW5kZXhSZXNwb25zZS5cbiAgICovXG4gIGdldEluZGV4ID0gYXN5bmMgKFxuICAgIGNvbnRhaW5lcklEOiBzdHJpbmcgPSBcIlwiLFxuICAgIGVuY29kaW5nOiBzdHJpbmcgPSBcImhleFwiLFxuICAgIGJhc2VVUkw6IHN0cmluZyA9IHRoaXMuZ2V0QmFzZVVSTCgpXG4gICk6IFByb21pc2U8c3RyaW5nPiA9PiB7XG4gICAgdGhpcy5zZXRCYXNlVVJMKGJhc2VVUkwpXG4gICAgY29uc3QgcGFyYW1zOiBHZXRJbmRleFBhcmFtcyA9IHtcbiAgICAgIGNvbnRhaW5lcklELFxuICAgICAgZW5jb2RpbmdcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3QgcmVzcG9uc2U6IFJlcXVlc3RSZXNwb25zZURhdGEgPSBhd2FpdCB0aGlzLmNhbGxNZXRob2QoXG4gICAgICAgIFwiaW5kZXguZ2V0SW5kZXhcIixcbiAgICAgICAgcGFyYW1zXG4gICAgICApXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHQuaW5kZXhcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNvbnRhaW5lciBpcyBhY2NlcHRlZFxuICAgKlxuICAgKiBAcGFyYW0gY29udGFpbmVySURcbiAgICogQHBhcmFtIGVuY29kaW5nXG4gICAqIEBwYXJhbSBiYXNlVVJMXG4gICAqXG4gICAqIEByZXR1cm5zIFJldHVybnMgYSBQcm9taXNlIEdldElzQWNjZXB0ZWRSZXNwb25zZS5cbiAgICovXG4gIGlzQWNjZXB0ZWQgPSBhc3luYyAoXG4gICAgY29udGFpbmVySUQ6IHN0cmluZyA9IFwiXCIsXG4gICAgZW5jb2Rpbmc6IHN0cmluZyA9IFwiaGV4XCIsXG4gICAgYmFzZVVSTDogc3RyaW5nID0gdGhpcy5nZXRCYXNlVVJMKClcbiAgKTogUHJvbWlzZTxJc0FjY2VwdGVkUmVzcG9uc2U+ID0+IHtcbiAgICB0aGlzLnNldEJhc2VVUkwoYmFzZVVSTClcbiAgICBjb25zdCBwYXJhbXM6IEdldElzQWNjZXB0ZWRQYXJhbXMgPSB7XG4gICAgICBjb250YWluZXJJRCxcbiAgICAgIGVuY29kaW5nXG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlOiBSZXF1ZXN0UmVzcG9uc2VEYXRhID0gYXdhaXQgdGhpcy5jYWxsTWV0aG9kKFxuICAgICAgICBcImluZGV4LmlzQWNjZXB0ZWRcIixcbiAgICAgICAgcGFyYW1zXG4gICAgICApXG4gICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5yZXN1bHRcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc29sZS5sb2coZXJyb3IpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFRoaXMgY2xhc3Mgc2hvdWxkIG5vdCBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkuIEluc3RlYWQgdXNlIHRoZSBbW0F4aWEuYWRkQVBJXV0gbWV0aG9kLlxuICAgKlxuICAgKiBAcGFyYW0gY29yZSBBIHJlZmVyZW5jZSB0byB0aGUgQXhpYSBjbGFzc1xuICAgKiBAcGFyYW0gYmFzZVVSTCBEZWZhdWx0cyB0byB0aGUgc3RyaW5nIFwiL2V4dC9pbmRleC9Td2FwL3R4XCIgYXMgdGhlIHBhdGggdG8gcnBjJ3MgYmFzZVVSTFxuICAgKi9cbiAgY29uc3RydWN0b3IoY29yZTogQXhpYUNvcmUsIGJhc2VVUkw6IHN0cmluZyA9IFwiL2V4dC9pbmRleC9Td2FwL3R4XCIpIHtcbiAgICBzdXBlcihjb3JlLCBiYXNlVVJMKVxuICB9XG59XG4iXX0=