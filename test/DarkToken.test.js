const { expectRevert } = require('@openzeppelin/test-helpers');
const DarkToken = artifacts.require('DarkToken');

contract('DarkToken', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.dark = await darkToken.new({ from: alice });
    });

    it('should have correct name and symbol and decimal', async () => {
        const name = await this.dark.name();
        const symbol = await this.dark.symbol();
        const decimals = await this.dark.decimals();
        assert.equal(name.valueOf(), 'DarkToken');
        assert.equal(symbol.valueOf(), 'DARK');
        assert.equal(decimals.valueOf(), '18');
    });

    it('should only allow owner to mint token', async () => {
        await this.dark.mint(alice, '100', { from: alice });
        await this.dark.mint(bob, '1000', { from: alice });
        await expectRevert(
            this.dark.mint(carol, '1000', { from: bob }),
            'Ownable: caller is not the owner',
        );
        const totalSupply = await this.dark.totalSupply();
        const aliceBal = await this.dark.balanceOf(alice);
        const bobBal = await this.dark.balanceOf(bob);
        const carolBal = await this.dark.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '100');
        assert.equal(bobBal.valueOf(), '1000');
        assert.equal(carolBal.valueOf(), '0');
    });

    it('should supply token transfers properly', async () => {
        await this.dark.mint(alice, '100', { from: alice });
        await this.dark.mint(bob, '1000', { from: alice });
        await this.dark.transfer(carol, '10', { from: alice });
        await this.dark.transfer(carol, '100', { from: bob });
        const totalSupply = await this.dark.totalSupply();
        const aliceBal = await this.dark.balanceOf(alice);
        const bobBal = await this.dark.balanceOf(bob);
        const carolBal = await this.dark.balanceOf(carol);
        assert.equal(totalSupply.valueOf(), '1100');
        assert.equal(aliceBal.valueOf(), '90');
        assert.equal(bobBal.valueOf(), '900');
        assert.equal(carolBal.valueOf(), '110');
    });

    it('should fail if you try to do bad transfers', async () => {
        await this.dark.mint(alice, '100', { from: alice });
        await expectRevert(
            this.dark.transfer(carol, '110', { from: alice }),
            'ERC20: transfer amount exceeds balance',
        );
        await expectRevert(
            this.dark.transfer(carol, '1', { from: bob }),
            'ERC20: transfer amount exceeds balance',
        );
    });

    it('should update vote of delegatee when delegator transfers', async () => {
        await this.dark.mint(alice, '100', { from: alice });
        await this.dark.delegate(bob, { from: alice });
        assert.equal(await this.dark.getCurrentVotes(alice), '0');
        assert.equal(await this.dark.getCurrentVotes(bob), '100');
        await this.dark.mint(alice, '100', { from: alice });
        assert.equal(await this.dark.getCurrentVotes(bob), '200');
        await this.dark.mint(carol, '100', { from: alice });
        await this.dark.transfer(alice, '50', { from: carol });
        assert.equal(await this.dark.getCurrentVotes(bob), '250');
        await this.dark.delegate(carol, { from: alice });
        assert.equal(await this.dark.getCurrentVotes(bob), '0');
        assert.equal(await this.dark.getCurrentVotes(carol), '250');
    });
  });
