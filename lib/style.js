const Parser = require('liqd-parser');
const StyleParser = new Parser( require('fs').readFileSync(__dirname+'/syntax/style.syntax', 'utf8') );

module.exports = class Style
{
	static compile( source )
	{
		//console.log( JSON.stringify(StyleParser.syntax, null, '  ') );

		return StyleParser.parse( source );
	}
}
