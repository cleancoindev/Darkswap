const DarkToken = artifacts.require('DarkToken');
const DarkConjuror = artifacts.require('DarkConjuror');
const MockERC20 = artifacts.require('MockERC20');
const UniswapV2Pair = artifacts.require('UniswapV2Pair');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');

contract('DarkConjuror', ([alice, hall, minter]) => {
    beforeEach(async () => {
        this.factory = await UniswapV2Factory.new(alice, { from: alice });
        this.dark = await DarkToken.new({ from: alice });
        await this.dark.mint(minter, '100000000', { from: alice });
        this.weth = await MockERC20.new('WETH', 'WETH', '100000000', { from: minter });
        this.token1 = await MockERC20.new('TOKEN1', 'TOKEN', '100000000', { from: minter });
        this.token2 = await MockERC20.new('TOKEN2', 'TOKEN2', '100000000', { from: minter });
        this.conjuror = await DarkConjuror.new(this.factory.address, hall, this.dark.address, this.weth.address);
        this.darkWETH = await UniswapV2Pair.at((await this.factory.createPair(this.weth.address, this.dark.address)).logs[0].args.pair);
        this.wethToken1 = await UniswapV2Pair.at((await this.factory.createPair(this.weth.address, this.token1.address)).logs[0].args.pair);
        this.wethToken2 = await UniswapV2Pair.at((await this.factory.createPair(this.weth.address, this.token2.address)).logs[0].args.pair);
        this.token1Token2 = await UniswapV2Pair.at((await this.factory.createPair(this.token1.address, this.token2.address)).logs[0].args.pair);
    });

    it('should make DARKs successfully', async () => {
        await this.factory.setFeeTo(this.conjuror.address, { from: alice });
        await this.weth.transfer(this.darkWETH.address, '10000000', { from: minter });
        await this.dark.transfer(this.darkWETH.address, '10000000', { from: minter });
        await this.darkWETH.mint(minter);
        await this.weth.transfer(this.wethToken1.address, '10000000', { from: minter });
        await this.token1.transfer(this.wethToken1.address, '10000000', { from: minter });
        await this.wethToken1.mint(minter);
        await this.weth.transfer(this.wethToken2.address, '10000000', { from: minter });
        await this.token2.transfer(this.wethToken2.address, '10000000', { from: minter });
        await this.wethToken2.mint(minter);
        await this.token1.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token1Token2.mint(minter);
        // Fake some revenue
        await this.token1.transfer(this.token1Token2.address, '100000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '100000', { from: minter });
        await this.token1Token2.sync();
        await this.token1.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token2.transfer(this.token1Token2.address, '10000000', { from: minter });
        await this.token1Token2.mint(minter);
        // Conjuror should have the LP now
        assert.equal((await this.token1Token2.balanceOf(this.conjuror.address)).valueOf(), '16528');
        // After calling convert, hall should have DARK value at ~1/6 of revenue
        await this.conjuror.convert(this.token1.address, this.token2.address);
        assert.equal((await this.dark.balanceOf(hall)).valueOf(), '32965');
        assert.equal((await this.token1Token2.balanceOf(this.conjuror.address)).valueOf(), '0');
        // Should also work for DARK-ETH pair
        await this.dark.transfer(this.darkWETH.address, '100000', { from: minter });
        await this.weth.transfer(this.darkWETH.address, '100000', { from: minter });
        await this.darkWETH.sync();
        await this.dark.transfer(this.darkWETH.address, '10000000', { from: minter });
        await this.weth.transfer(this.darkWETH.address, '10000000', { from: minter });
        await this.darkWETH.mint(minter);
        assert.equal((await this.darkWETH.balanceOf(this.conjuror.address)).valueOf(), '16537');
        await this.conjuror.convert(this.dark.address, this.weth.address);
        assert.equal((await this.dark.balanceOf(hall)).valueOf(), '66249');
        assert.equal((await this.darkWETH.balanceOf(this.conjuror.address)).valueOf(), '0');
    });
});