let INITIALIZED, StyleParser;

// screen.orientation.lock('portrait')
const extend = ( target, source ) => { Object.keys( source ).forEach( key => target[key] = !target.hasOwnProperty(key) ? source[key] : ( typeof target[key] !== 'object' || !source.hasOwnProperty(key) ? target[key] : extend( target[key], source[key] ))); return target; };
const clone = ( obj, defaults = null ) => defaults ? extend( JSON.parse(JSON.stringify(obj)), JSON.parse(JSON.stringify(defaults)) ) : JSON.parse(JSON.stringify(obj));

const DEFAULT_OPTIONS =
{
	media:
	{
		phone:				'(max-width:575.98px),(min-width:576px)and(max-width:767.98px)and(orientation:landscape)',
		phone_portrait:		'(max-width:575.98px)',
		phone_landscape:	'(max-width:767.98px)and(orientation:landscape)',
		tablet:				'(min-width:576px)and(max-width:767.98px)and(orientation:portrait),(min-width:768px)and(max-width:991.98px)',
		tablet_portrait:	'(min-width:576px)and(max-width:767.98px)and(orientation:portrait)',
		tablet_landscape:	'(min-width:768px)and(max-width:991.98px)',
		computer:			'(min-width:992px)',
		computer_small:		'(min-width:992px)and(max-width:1199.98px)',
		computer_large:		'(min-width:1200px)'
	}
}

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

		console.log( JSON.stringify( scope, null, ' ' ) );

		Style._compile_definitions( StyleParser.parse( source ).definitions, scope );

		return scope.compiled.join( options.minify ? '' : '\n' );
	}

	static _resolve_value( value, scope )
	{
		let variable_value;
		return value.replace( /\$([a-zA-Z_][a-zA-Z0-9_\-]*)/g, ( _, variable ) =>
		{
			for( let variables of scope.variables_chain )
			{
				if( variable_value = variables.get( variable ) ){ return variable_value; }
			}
		});
	}

	static _resolve_generator( generator, scope, properties )
	{
		let definitions;
		for( let generators of scope.generators_chain )
		{
			if( definitions = generators.get( generator ) )
			{
				return Style._compile_definitions( definitions, scope, properties );
			}
		}
	}

	static _resolve_selector( selector, scope )
	{
		return selector.split(/\s*,\s*/).reduce( ( selectors, selector ) =>
		{
			let reverse = false, glue = ' '; selector = selector.replace(/^\s*(&{0,1})\s*(.*?)\s*(&{0,1})\s*$/, ( _, append, selector, prepend ) =>
			{
				if( append ){ glue = ''; } else
				if( prepend ){ reverse = true; }

				return selector;
			});

			if( scope.selectors_chain[0] )
			{
				for( let parent_selector of scope.selectors_chain[0] )
				{
					selectors.push(( reverse ? selector: parent_selector ) + glue + ( reverse ? parent_selector : selector ));
				}
			}
			else{ selectors.push( selector ); }

			return selectors;
		},
		[]);
	}

	static _compile_definitions( definitions, scope, properties )
	{
		let variables, generators;

		for( let definition of definitions )
		{
			if( definition.property )
			{
				properties.delete( definition.property );
				properties.set( definition.property, Style._resolve_value( definition.value, scope ));
			}
			else if( definition.selector )
			{
				let properties = new Map(), selector = Style._resolve_selector( definition.selector, scope ),
					compiled_index = scope.compiled.length, compiled = selector.join( scope.options.minify ? ',' : ', ' ) + ( scope.options.minify ? '{' : '\n{' );

				scope.selectors_chain.unshift( selector );
				Style._compile_definitions( definition.definitions, scope, properties );
				scope.selectors_chain.shift();

				if( properties.size )
				{
					for( let [ property, value ] of properties.entries() )
					{
						compiled += ( scope.options.minify ? '' : '\n\t' ) + property + ':' + value + ';';
					}

					scope.compiled.splice( compiled_index, 0, compiled.substr(0, compiled.length - ( scope.options.minify ? 1 : 0 )) + ( scope.options.minify ? '}' : '\n}' ) );
				}
			}
			else if( definition.generator )
			{
				Style._resolve_generator( definition.generator, scope, properties )
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
				let properties = new Map(), compiled_index = scope.compiled.length, compiled = definition.keyword.replace(/^@media\s*(.*?)\s*$/, ( media, rule ) =>
				{
					return scope.options.media && scope.options.media[rule] ? '@media ' + scope.options.media[rule] : media;
				})
				+ ( scope.options.minify ? '{' : '\n{' );

				Style._compile_definitions( definition.definitions, scope, properties );

				if( properties.size )
				{
					compiled += Style._resolve_selector( '', scope ).join( scope.options.minify ? ',' : ', ' ) + ( scope.options.minify ? '{' : '\n{' );

					for( let [ property, value ] of properties.entries() )
					{
						compiled += ( scope.options.minify ? '' : '\n\t' ) + property + ':' + value + ';';
					}

					scope.compiled.splice( compiled_index, 0, compiled.substr(0, compiled.length - ( scope.options.minify ? 1 : 0 )) + ( scope.options.minify ? '}' : '\n}' ) );
				}
				else
				{
					scope.compiled.splice( compiled_index, 0, compiled );
				}

				scope.compiled.push( scope.options.minify ? '}' : '\n}' );
			}
		}

		if( variables ){ scope.variables_chain.shift(); }
		if( generators ){ scope.generators_chain.shift(); }
	}
}
