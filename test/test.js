'use strict';

const Style = require('../lib/style');

const style =
`
/* janko hrasko */
$font: 'Tahoma', 'Helvetica' ;
$font3: $font2;
$font2: $font;
$color: red;
@border-radius{ border-radius: 5px; }
@box{ top:0; left:0; right:0; bottom:0; color: $color; }
html, body
{
	margin: 0;
	$color: rgba(255,0,0,0.2);

	&:hover, &:focus{ $color:magenta; color: $color; @box; }

	$font: 'Tahoma', 'Helvetica' ;
	a, b
	{
		padding: 6px;
		padding: 7px;
		@border-radius; // jozo je tu
		padding: 0px;
		padding: 5px;
		@box;

		&:hover
		{
			color: red;

			.active
			{
				color: blue;
			}
		}

		body.noscroll &{ color:silver; }
	}
}
`;

Style.init();

let start = process.hrtime(), i, compiled;

for( i = 0; i < 1000; ++i )
{
	compiled = Style.compile( style );
}
let end = process.hrtime(start);

console.log( compiled );
console.log( ( (end[0] + end[1]/1e9) * 1000 / i ).toFixed(2) + 'ms' );
