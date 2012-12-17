describe('Main test suite', function () {
    it('adds two numbers together', function () {
        expect(1 + 2).toEqual(3);
    });

    it('True to be True', function () {
        expect(true).toEqual(!!true);
    });

    it('has div in body', function () {
        var div = $('<div class="pouet"></div>')
        $('body').append(div);
        if($('.pouet').length) {
        	//debugger
        } 

    });
});