const { expectRevert } = require('@openzeppelin/test-helpers');
const DarkToken = artifacts.require('DarkToken');
const DarkHall = artifacts.require('DarkHall');

contract('DarkHall', ([alice, bob, carol]) => {
    beforeEach(async () => {
        this.dark = await DarkToken.new({ from: alice });
        this.hall = await DarkHall.new(this.dark.address, { from: alice });
        this.dark.mint(alice, '100', { from: alice });
        this.dark.mint(bob, '100', { from: alice });
        this.dark.mint(carol, '100', { from: alice });
    });

    it('should not allow enter if not enough approve', async () => {
        await expectRevert(
            this.hall.enter('100', { from: alice }),
            'ERC20: transfer amount exceeds allowance',
        );
        await this.dark.approve(this.hall.address, '50', { from: alice });
        await expectRevert(
            this.hall.enter('100', { from: alice }),
            'ERC20: transfer amount exceeds allowance',
        );
        await this.dark.approve(this.hall.address, '100', { from: alice });
        await this.hall.enter('100', { from: alice });
        assert.equal((await this.hall.balanceOf(alice)).valueOf(), '100');
    });

    it('should not allow withraw more than what you have', async () => {
        await this.dark.approve(this.hall.address, '100', { from: alice });
        await this.hall.enter('100', { from: alice });
        await expectRevert(
            this.hall.leave('200', { from: alice }),
            'ERC20: burn amount exceeds balance',
        );
    });

    it('should work with more than one participant', async () => {
        await this.dark.approve(this.hall.address, '100', { from: alice });
        await this.dark.approve(this.hall.address, '100', { from: bob });
        // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
        await this.hall.enter('20', { from: alice });
        await this.hall.enter('10', { from: bob });
        assert.equal((await this.hall.balanceOf(alice)).valueOf(), '20');
        assert.equal((await this.hall.balanceOf(bob)).valueOf(), '10');
        assert.equal((await this.dark.balanceOf(this.hall.address)).valueOf(), '30');
        // DarkHall get 20 more DARKs from an external source.
        await this.dark.transfer(this.hall.address, '20', { from: carol });
        // Alice deposits 10 more DARKs. She should receive 10*30/50 = 6 shares.
        await this.hall.enter('10', { from: alice });
        assert.equal((await this.hall.balanceOf(alice)).valueOf(), '26');
        assert.equal((await this.hall.balanceOf(bob)).valueOf(), '10');
        // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
        await this.hall.leave('5', { from: bob });
        assert.equal((await this.hall.balanceOf(alice)).valueOf(), '26');
        assert.equal((await this.hall.balanceOf(bob)).valueOf(), '5');
        assert.equal((await this.dark.balanceOf(this.hall.address)).valueOf(), '52');
        assert.equal((await this.dark.balanceOf(alice)).valueOf(), '70');
        assert.equal((await this.dark.balanceOf(bob)).valueOf(), '98');
    });
});
