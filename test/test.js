'use strict';

const Style = require('../lib/style');

const style =
`
$font: 'Tahoma', 'Helvetica' ;
@border-radius{ border-radius: 5px; }
html, body
{
	margin: 0;
	$color: rgba(255,0,0,0.2);

	$font: 'Tahoma', 'Helvetica' ;
	a
	{
		@border-radius;
		padding: 0;
	}
}
`;

let start = process.hrtime();
let compiled = Style.compile( style );
let end = process.hrtime(start);

console.log( JSON.stringify( compiled, null, '  ' ) );
console.log( (end[0] + end[1]/1e9).toFixed(3) + 's' );
