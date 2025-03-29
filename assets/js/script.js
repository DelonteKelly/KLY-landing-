// Initialize Thirdweb
const thirdweb = new Thirdweb.ThirdwebSDK("binance");

// Handle Launchpad Form
document.getElementById("launch-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = e.target[0].value;
  const symbol = e.target[1].value;
  const totalSupply = parseFloat(e.target[2].value);
  const treasuryAddress = "0x2e4fEB2Fe668c8Ebe84f19e6c8fE8Cf8131B4E52";

  if (!window.userAddress) {
    alert("Connect your wallet first.");
    return;
  }

  if (isNaN(totalSupply) || totalSupply < 10000) {
    alert("Minimum total supply is 10,000 KLY.");
    return;
  }

  try {
    const deployedToken = await thirdweb.deployer.deployToken({
      name,
      symbol,
      primary_sale_recipient: window.userAddress,
      total_supply: totalSupply.toString(),
    });

    const token = await thirdweb.getContract(deployedToken, "token");
    const treasuryAmount = totalSupply * 0.05;
    await token.erc20.transfer(treasuryAddress, treasuryAmount.toString());

    alert(`Token ${name} (${symbol}) deployed! 5% sent to treasury.`);
    console.log("Token deployed at:", deployedToken);
  } catch (err) {
    console.error(err);
    alert("Something went wrong deploying your token.");
  }
});
