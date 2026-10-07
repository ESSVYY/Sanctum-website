import ts from 'typescript';
import fs from 'node:fs';
const file='components/reference-sections.tsx';
const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
fs.writeFileSync(file,ts.createPrinter({newLine:ts.NewLineKind.LineFeed}).printFile(source));
