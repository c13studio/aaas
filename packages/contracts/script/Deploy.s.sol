// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/AaaSPaymentLink.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = 0x3600000000000000000000000000000000000000;
        
        vm.startBroadcast(deployerPrivateKey);
        
        AaaSPaymentLink paymentLink = new AaaSPaymentLink(usdc);
        
        console.log("AaaSPaymentLink deployed to:", address(paymentLink));
        
        vm.stopBroadcast();
    }
}
