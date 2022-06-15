"use strict";
/**
 * @packageDocumentation
 * @module API-AXVM-Constants
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AXVMConstants = void 0;
class AXVMConstants {
}
exports.AXVMConstants = AXVMConstants;
AXVMConstants.LATESTCODEC = 0;
AXVMConstants.SECPFXID = 0;
AXVMConstants.NFTFXID = 1;
AXVMConstants.SECPMINTOUTPUTID = 6;
AXVMConstants.SECPMINTOUTPUTID_CODECONE = 65537;
AXVMConstants.SECPXFEROUTPUTID = 7;
AXVMConstants.SECPXFEROUTPUTID_CODECONE = 65538;
AXVMConstants.NFTXFEROUTPUTID = 11;
AXVMConstants.NFTXFEROUTPUTID_CODECONE = 131073;
AXVMConstants.NFTMINTOUTPUTID = 10;
AXVMConstants.NFTMINTOUTPUTID_CODECONE = 131072;
AXVMConstants.SECPINPUTID = 5;
AXVMConstants.SECPINPUTID_CODECONE = 65536;
AXVMConstants.SECPMINTOPID = 8;
AXVMConstants.SECPMINTOPID_CODECONE = 65539;
AXVMConstants.NFTMINTOPID = 12;
AXVMConstants.NFTMINTOPID_CODECONE = 131074;
AXVMConstants.NFTXFEROPID = 13;
AXVMConstants.NFTXFEROPID_CODECONE = 131075;
AXVMConstants.BASETX = 0;
AXVMConstants.BASETX_CODECONE = 0;
AXVMConstants.CREATEASSETTX = 1;
AXVMConstants.CREATEASSETTX_CODECONE = 1;
AXVMConstants.OPERATIONTX = 2;
AXVMConstants.OPERATIONTX_CODECONE = 2;
AXVMConstants.IMPORTTX = 3;
AXVMConstants.IMPORTTX_CODECONE = 3;
AXVMConstants.EXPORTTX = 4;
AXVMConstants.EXPORTTX_CODECONE = 4;
AXVMConstants.SECPCREDENTIAL = 9;
AXVMConstants.SECPCREDENTIAL_CODECONE = 65540;
AXVMConstants.NFTCREDENTIAL = 14;
AXVMConstants.NFTCREDENTIAL_CODECONE = 131076;
AXVMConstants.ASSETIDLEN = 32;
AXVMConstants.BLOCKCHAINIDLEN = 32;
AXVMConstants.SYMBOLMAXLEN = 4;
AXVMConstants.ASSETNAMELEN = 128;
AXVMConstants.ADDRESSLENGTH = 20;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RhbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2FwaXMvYXh2bS9jb25zdGFudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7O0FBRUgsTUFBYSxhQUFhOztBQUExQixzQ0E0RUM7QUEzRVEseUJBQVcsR0FBVyxDQUFDLENBQUE7QUFFdkIsc0JBQVEsR0FBVyxDQUFDLENBQUE7QUFFcEIscUJBQU8sR0FBVyxDQUFDLENBQUE7QUFFbkIsOEJBQWdCLEdBQVcsQ0FBQyxDQUFBO0FBRTVCLHVDQUF5QixHQUFXLEtBQUssQ0FBQTtBQUV6Qyw4QkFBZ0IsR0FBVyxDQUFDLENBQUE7QUFFNUIsdUNBQXlCLEdBQVcsS0FBSyxDQUFBO0FBRXpDLDZCQUFlLEdBQVcsRUFBRSxDQUFBO0FBRTVCLHNDQUF3QixHQUFXLE1BQU0sQ0FBQTtBQUV6Qyw2QkFBZSxHQUFXLEVBQUUsQ0FBQTtBQUU1QixzQ0FBd0IsR0FBVyxNQUFNLENBQUE7QUFFekMseUJBQVcsR0FBVyxDQUFDLENBQUE7QUFFdkIsa0NBQW9CLEdBQVcsS0FBSyxDQUFBO0FBRXBDLDBCQUFZLEdBQVcsQ0FBQyxDQUFBO0FBRXhCLG1DQUFxQixHQUFXLEtBQUssQ0FBQTtBQUVyQyx5QkFBVyxHQUFXLEVBQUUsQ0FBQTtBQUV4QixrQ0FBb0IsR0FBVyxNQUFNLENBQUE7QUFFckMseUJBQVcsR0FBVyxFQUFFLENBQUE7QUFFeEIsa0NBQW9CLEdBQVcsTUFBTSxDQUFBO0FBRXJDLG9CQUFNLEdBQVcsQ0FBQyxDQUFBO0FBRWxCLDZCQUFlLEdBQVcsQ0FBQyxDQUFBO0FBRTNCLDJCQUFhLEdBQVcsQ0FBQyxDQUFBO0FBRXpCLG9DQUFzQixHQUFXLENBQUMsQ0FBQTtBQUVsQyx5QkFBVyxHQUFXLENBQUMsQ0FBQTtBQUV2QixrQ0FBb0IsR0FBVyxDQUFDLENBQUE7QUFFaEMsc0JBQVEsR0FBVyxDQUFDLENBQUE7QUFFcEIsK0JBQWlCLEdBQVcsQ0FBQyxDQUFBO0FBRTdCLHNCQUFRLEdBQVcsQ0FBQyxDQUFBO0FBRXBCLCtCQUFpQixHQUFXLENBQUMsQ0FBQTtBQUU3Qiw0QkFBYyxHQUFXLENBQUMsQ0FBQTtBQUUxQixxQ0FBdUIsR0FBVyxLQUFLLENBQUE7QUFFdkMsMkJBQWEsR0FBVyxFQUFFLENBQUE7QUFFMUIsb0NBQXNCLEdBQVcsTUFBTSxDQUFBO0FBRXZDLHdCQUFVLEdBQVcsRUFBRSxDQUFBO0FBRXZCLDZCQUFlLEdBQVcsRUFBRSxDQUFBO0FBRTVCLDBCQUFZLEdBQVcsQ0FBQyxDQUFBO0FBRXhCLDBCQUFZLEdBQVcsR0FBRyxDQUFBO0FBRTFCLDJCQUFhLEdBQVcsRUFBRSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAcGFja2FnZURvY3VtZW50YXRpb25cbiAqIEBtb2R1bGUgQVBJLUFYVk0tQ29uc3RhbnRzXG4gKi9cblxuZXhwb3J0IGNsYXNzIEFYVk1Db25zdGFudHMge1xuICBzdGF0aWMgTEFURVNUQ09ERUM6IG51bWJlciA9IDBcblxuICBzdGF0aWMgU0VDUEZYSUQ6IG51bWJlciA9IDBcblxuICBzdGF0aWMgTkZURlhJRDogbnVtYmVyID0gMVxuXG4gIHN0YXRpYyBTRUNQTUlOVE9VVFBVVElEOiBudW1iZXIgPSA2XG5cbiAgc3RhdGljIFNFQ1BNSU5UT1VUUFVUSURfQ09ERUNPTkU6IG51bWJlciA9IDY1NTM3XG5cbiAgc3RhdGljIFNFQ1BYRkVST1VUUFVUSUQ6IG51bWJlciA9IDdcblxuICBzdGF0aWMgU0VDUFhGRVJPVVRQVVRJRF9DT0RFQ09ORTogbnVtYmVyID0gNjU1MzhcblxuICBzdGF0aWMgTkZUWEZFUk9VVFBVVElEOiBudW1iZXIgPSAxMVxuXG4gIHN0YXRpYyBORlRYRkVST1VUUFVUSURfQ09ERUNPTkU6IG51bWJlciA9IDEzMTA3M1xuXG4gIHN0YXRpYyBORlRNSU5UT1VUUFVUSUQ6IG51bWJlciA9IDEwXG5cbiAgc3RhdGljIE5GVE1JTlRPVVRQVVRJRF9DT0RFQ09ORTogbnVtYmVyID0gMTMxMDcyXG5cbiAgc3RhdGljIFNFQ1BJTlBVVElEOiBudW1iZXIgPSA1XG5cbiAgc3RhdGljIFNFQ1BJTlBVVElEX0NPREVDT05FOiBudW1iZXIgPSA2NTUzNlxuXG4gIHN0YXRpYyBTRUNQTUlOVE9QSUQ6IG51bWJlciA9IDhcblxuICBzdGF0aWMgU0VDUE1JTlRPUElEX0NPREVDT05FOiBudW1iZXIgPSA2NTUzOVxuXG4gIHN0YXRpYyBORlRNSU5UT1BJRDogbnVtYmVyID0gMTJcblxuICBzdGF0aWMgTkZUTUlOVE9QSURfQ09ERUNPTkU6IG51bWJlciA9IDEzMTA3NFxuXG4gIHN0YXRpYyBORlRYRkVST1BJRDogbnVtYmVyID0gMTNcblxuICBzdGF0aWMgTkZUWEZFUk9QSURfQ09ERUNPTkU6IG51bWJlciA9IDEzMTA3NVxuXG4gIHN0YXRpYyBCQVNFVFg6IG51bWJlciA9IDBcblxuICBzdGF0aWMgQkFTRVRYX0NPREVDT05FOiBudW1iZXIgPSAwXG5cbiAgc3RhdGljIENSRUFURUFTU0VUVFg6IG51bWJlciA9IDFcblxuICBzdGF0aWMgQ1JFQVRFQVNTRVRUWF9DT0RFQ09ORTogbnVtYmVyID0gMVxuXG4gIHN0YXRpYyBPUEVSQVRJT05UWDogbnVtYmVyID0gMlxuXG4gIHN0YXRpYyBPUEVSQVRJT05UWF9DT0RFQ09ORTogbnVtYmVyID0gMlxuXG4gIHN0YXRpYyBJTVBPUlRUWDogbnVtYmVyID0gM1xuXG4gIHN0YXRpYyBJTVBPUlRUWF9DT0RFQ09ORTogbnVtYmVyID0gM1xuXG4gIHN0YXRpYyBFWFBPUlRUWDogbnVtYmVyID0gNFxuXG4gIHN0YXRpYyBFWFBPUlRUWF9DT0RFQ09ORTogbnVtYmVyID0gNFxuXG4gIHN0YXRpYyBTRUNQQ1JFREVOVElBTDogbnVtYmVyID0gOVxuXG4gIHN0YXRpYyBTRUNQQ1JFREVOVElBTF9DT0RFQ09ORTogbnVtYmVyID0gNjU1NDBcblxuICBzdGF0aWMgTkZUQ1JFREVOVElBTDogbnVtYmVyID0gMTRcblxuICBzdGF0aWMgTkZUQ1JFREVOVElBTF9DT0RFQ09ORTogbnVtYmVyID0gMTMxMDc2XG5cbiAgc3RhdGljIEFTU0VUSURMRU46IG51bWJlciA9IDMyXG5cbiAgc3RhdGljIEJMT0NLQ0hBSU5JRExFTjogbnVtYmVyID0gMzJcblxuICBzdGF0aWMgU1lNQk9MTUFYTEVOOiBudW1iZXIgPSA0XG5cbiAgc3RhdGljIEFTU0VUTkFNRUxFTjogbnVtYmVyID0gMTI4XG5cbiAgc3RhdGljIEFERFJFU1NMRU5HVEg6IG51bWJlciA9IDIwXG59XG4iXX0=