import peg from 'pegjs';
import fs from 'fs';
import Mapper from './lib/mapper';

const grammar = fs.readFileSync(
	`${__dirname}/../app/parsers/grammar.pegjs`,
	'utf-8'
);

const graphDef = fs.readFileSync(
	`${__dirname}/../app/test/graphs/main.graph`,
	'utf-8'
);

const parser = peg.generate(grammar);

const graphs = parser.parse(graphDef);

graphs.forEach((graph) => {
	const mapper = new Mapper(graph);
});
