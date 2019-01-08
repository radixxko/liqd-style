'use strict';

const Style = require('../lib/style');

const style =
`
/*janko hrasko
a
{
	color: red;
	@media phone
	{
		color: blue;
	}
}*/
//-webkit-overflow-scrolling: touch;
-webkit-overflow-scrolling: touch;
@keyframes jozo
{
	0% { left: 0; }
	100% { left: 100px; }
}
@font-face
{
    font-family: 'SanFranciscoWeb';
    font-weight: 100;
    font-style: normal;
    src: url('/static/fonts/myriadpro/MyriadPro-Light.otf');
    src: url('/static/fonts/myriadpro/MyriadPro-Light.otf') format('opentype');
    src: url('/static/fonts/myriadpro/MyriadPro-Light.eot');
    src: url('/static/fonts/myriadpro/MyriadPro-Light.eot?#iefix') format('embedded-opentype'),
    url('/static/fonts/myriadpro/MyriadPro-Light.woff') format('woff'),
    url('/static/fonts/myriadpro/MyriadPro-Light.ttf')  format('truetype');
}
@media super{
$font: 'Tahoma', 'Helvetica' ;
$font3: $font2;
$font2: $font;
$color: red;
$width: 8px;
@border-radius{ border-radius: 5px; }
@box{ top:0; left:0; right:0; bottom:0; color: $color; }
html, body
{
	-webkit-border-radius: 5px;
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
		padding: $width $width $width $width;
		@box;

		&:hover
		{
			color: red;

			content: "\\f056";

			.active
			{
				color: blue;

				content: '\\f056';
			}
		}

		body.noscroll &{ color:silver; }

		li:not(:first-child):before{ color: red; }
	}
}}
`;

Style.init();

let start = process.hrtime(), i, compiled;

for( i = 0; i < 1; ++i )
{
	compiled = Style.compile( style );
}
let end = process.hrtime(start);

console.log( compiled );
console.log( ( (end[0] + end[1]/1e9) * 1000 / i ).toFixed(2) + 'ms' );
