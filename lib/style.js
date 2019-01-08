let INITIALIZED, StyleParser;

// screen.orientation.lock('portrait')
const extend = ( target, source ) => { Object.keys( source ).forEach( key => target[key] = !target.hasOwnProperty(key) ? source[key] : ( typeof target[key] !== 'object' || !source.hasOwnProperty(key) ? target[key] : extend( target[key], source[key] ))); return target; };
const clone = ( obj, defaults = null ) => defaults ? extend( JSON.parse(JSON.stringify(obj)), JSON.parse(JSON.stringify(defaults)) ) : JSON.parse(JSON.stringify(obj));

const DEFAULT_OPTIONS =
{
	media:
	{
		phone:				'(orientation:portrait)',
		not_phone:			'(orientation:landscape)',
		tablet:				'(min-width:768px) and (max-width:991.98px) and (orientation:landscape)',
		computer:			'(min-width:992px) and (orientation:landscape)',
		computer_small:		'(min-width:992px) and (max-width:1199.98px) and (orientation:landscape)',
		computer_large:		'(min-width:1200px) and (orientation:landscape)'
	}
}

const VALUE_RE = /\$([a-zA-Z_][a-zA-Z0-9_\-]*)/g;
const SELECTOR_DELIMITER = /\s*,\s*/;
const SELECTOR_RE = /^\s*(&{0,1})\s*(.*?)\s*(&{0,1})\s*$/;
const LAST_SEMICOLON = /;}/g;
const NEWLINES = /\s*\n\s*/g;

const Style = module.exports = class Style
{
	static init()
	{
		if( !INITIALIZED && ( INITIALIZED = true ))
		{
			StyleParser = new( require('liqd-parser') )( require('fs').readFileSync(__dirname+'/syntax/style.syntax', 'utf8') );
		}
	}

	static compile( source, options = {} )
	{
		Style.init();

		let scope = { variables_chain: [], generators_chain: [], selectors_chain: [], compiled: [], options: clone( options, DEFAULT_OPTIONS ) };

		Style._compile( StyleParser.parse( source ).definitions, scope );

		return scope.compiled.join('').replace( LAST_SEMICOLON, '}');
	}

	static _resolve_value( value, scope )
	{
		let variable_value;
		return value.replace( VALUE_RE, ( _, variable ) =>
		{
			for( let variables of scope.variables_chain )
			{
				if( variable_value = variables.get( variable ) ){ return variable_value; }
			}
		});
	}

	static _resolve_generator( generator, scope )
	{
		let definitions;
		for( let generators of scope.generators_chain )
		{
			if( definitions = generators.get( generator ) )
			{
				return Style._compile( definitions, scope );
			}
		}
	}

	static _resolve_selector( selector, scope )
	{
		return selector.split( SELECTOR_DELIMITER ).reduce( ( selectors, selector ) =>
		{
			let reverse = false; selector = selector.replace( SELECTOR_RE, ( _, append, selector, prepend ) =>
			{
				if( prepend ){ reverse = true; }

				return selector;
			});

			if( scope.selectors_chain[0] )
			{
				for( let parent_selector of scope.selectors_chain[0] )
				{
					selectors.push(( reverse ? selector: parent_selector ) + ( reverse ? parent_selector : selector ));
				}
			}
			else{ selectors.push( selector ); }

			return selectors;
		},
		[]);
	}

	static _compile( definitions, scope )
	{
		let variables, generators, selectors = Style._resolve_selector( '', scope ).join(','), selector_is_open = false;

		for( let definition of definitions )
		{
			if( definition.property )
			{
				if( !selector_is_open && selectors )
				{
					selector_is_open = true;
					scope.compiled.push( selectors + '{' );
				}

				scope.compiled.push( definition.property + ':' + Style._resolve_value( definition.value, scope ).replace(NEWLINES, ' ').trim() + ';' );
			}
			else if( definition.selector )
			{
				if( selector_is_open )
				{
					selector_is_open = false;
					scope.compiled.push( '}' );
				}

				scope.selectors_chain.unshift( Style._resolve_selector( definition.selector, scope ) );
				Style._compile( definition.definitions, scope );
				scope.selectors_chain.shift();
			}
			else if( definition.generator )
			{
				if( selector_is_open )
				{
					selector_is_open = false;
					scope.compiled.push( '}' );
				}

				Style._resolve_generator( definition.generator, scope )
			}
			else if( definition.variable_definition )
			{
				if( !variables ){ scope.variables_chain.unshift( variables = new Map() ); }

				variables.set( definition.variable_definition.name, Style._resolve_value( definition.variable_definition.value, scope ));
			}
			else if( definition.generator_definition )
			{
				if( !generators ){ scope.generators_chain.unshift( generators = new Map() ); }

				generators.set( definition.generator_definition.name, definition.generator_definition.definitions );
			}
			else if( definition.keyword )
			{
				if( selector_is_open )
				{
					selector_is_open = false;
					scope.compiled.push( '}' );
				}

				scope.compiled.push( definition.keyword.replace(/^@media\s*(.*?)\s*$/, ( media, rule ) => scope.options.media && scope.options.media[rule] ? '@media ' + scope.options.media[rule] : media ) + '{' );

				Style._compile( definition.definitions, scope );

				scope.compiled.push( '}' );
			}
		}

		if( selector_is_open )
		{
			scope.compiled.push( '}' );
		}
		if( variables ){ scope.variables_chain.shift(); }
		if( generators ){ scope.generators_chain.shift(); }
	}
}
