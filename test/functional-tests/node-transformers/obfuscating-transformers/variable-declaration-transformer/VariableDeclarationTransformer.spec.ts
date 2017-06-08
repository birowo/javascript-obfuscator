import { assert } from 'chai';

import { IObfuscationResult } from '../../../../../src/interfaces/IObfuscationResult';

import { NO_CUSTOM_NODES_PRESET } from '../../../../../src/options/presets/NoCustomNodes';

import { readFileAsString } from '../../../../helpers/readFileAsString';

import { JavaScriptObfuscator } from '../../../../../src/JavaScriptObfuscator';

describe('VariableDeclarationTransformer', () => {
    it('should transform `variableDeclaration` node', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/simple-declaration.js');

        let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );

        assert.match(obfuscationResult.getObfuscatedCode(),  /var *_0x([a-f0-9]){4,6} *= *'abc';/);
        assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(_0x([a-f0-9]){4,6}\);/);
    });

    it('should not transform `variableDeclaration` node if parent block scope node is `Program` node', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/parent-block-scope-is-program-node.js');

        let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );

        assert.match(obfuscationResult.getObfuscatedCode(),  /var *test *= *0xa;/);
        assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(test\);/);
    });

    it('should transform variable call (`identifier` node) outside of block scope of node in which this variable was declared with `var` kind', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/var-kind.js');

        let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );

        assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(_0x([a-f0-9]){4,6}\);/);
    });

    it('should not transform variable call (`identifier` node) outside of block scope of node in which this variable was declared with `let` kind', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/let-kind.js');

        let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );

        assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(test\);/);
    });

    describe(`variable calls before variable declaration`, () => {
        let obfuscationResult: IObfuscationResult;

        beforeEach(() => {
            const code: string = readFileAsString(__dirname + '/fixtures/variable-call-before-variable-declaration-1.js');

            obfuscationResult = JavaScriptObfuscator.obfuscate(
                code,
                {
                    ...NO_CUSTOM_NODES_PRESET
                }
            );
        });

        it('should transform variable call (`identifier` node name) before variable declaration if this call is inside function body', () => {
            assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(_0x([a-f0-9]){4,6}\['item'\]\);/);
        });

        it('should transform variable call (`identifier` node name) before variable declaration', () => {
            assert.match(obfuscationResult.getObfuscatedCode(),  /console\['log'\]\(_0x([a-f0-9]){4,6}\);/);
        });
    });

    describe(`variable calls before variable declaration when function param has the same name as variables name`, () => {
        const code: string = readFileAsString(__dirname + '/fixtures/variable-call-before-variable-declaration-2.js');
        const obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );
        const obfuscatedCode: string = obfuscationResult.getObfuscatedCode();

        const functionParamIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/function *_0x[a-f0-9]{4,6} *\((_0x[a-f0-9]{4,6})\,(_0x[a-f0-9]{4,6})\) *\{/);
        const innerFunctionParamIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/function _0x[a-f0-9]{4,6} *\((_0x[a-f0-9]{4,6})\) *\{/);
        const constructorIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/console\['log'\]\((_0x[a-f0-9]{4,6})\)/);
        const objectIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/return\{'t':(_0x[a-f0-9]{4,6})\}/);
        const variableDeclarationIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/var *(_0x[a-f0-9]{4,6});/);

        const outerFunctionParamIdentifierName: string|null = (<RegExpMatchArray>functionParamIdentifierMatch)[1];
        const innerFunctionParamIdentifierName: string|null = (<RegExpMatchArray>innerFunctionParamIdentifierMatch)[1];
        const constructorIdentifierName: string|null = (<RegExpMatchArray>constructorIdentifierMatch)[1];
        const objectIdentifierName: string|null = (<RegExpMatchArray>objectIdentifierMatch)[1];
        const variableDeclarationIdentifierName: string|null = (<RegExpMatchArray>variableDeclarationIdentifierMatch)[1];

        it('should\'t name variables inside inner function with names from outer function params', () => {
            assert.notEqual(outerFunctionParamIdentifierName, constructorIdentifierName);
            assert.notEqual(outerFunctionParamIdentifierName, innerFunctionParamIdentifierName);
        });

        it('should correct transform variables inside outer function body', () => {
            assert.equal(outerFunctionParamIdentifierName, objectIdentifierName);
            assert.equal(outerFunctionParamIdentifierName, variableDeclarationIdentifierName);
        });

        it('should correct transform variables inside inner function body', () => {
            assert.equal(innerFunctionParamIdentifierName, constructorIdentifierName);
        });

        it('should keep equal names after transformation for variables with same names', () => {
            assert.equal(variableDeclarationIdentifierName, objectIdentifierName);
        });
    });

    describe(`variable calls before variable declaration when catch clause param has the same name as variables name`, () => {
        const code: string = readFileAsString(__dirname + '/fixtures/variable-call-before-variable-declaration-3.js');
        const obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );
        const obfuscatedCode: string = obfuscationResult.getObfuscatedCode();

        const catchClauseParamIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/catch *\((_0x[a-f0-9]{4,6})\) *\{/);
        const innerFunctionParamIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/function _0x[a-f0-9]{4,6} *\((_0x[a-f0-9]{4,6})\) *\{/);
        const constructorIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/console\['log'\]\((_0x[a-f0-9]{4,6})\)/);
        const objectIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/return\{'t':(_0x[a-f0-9]{4,6})\}/);
        const variableDeclarationIdentifierMatch: RegExpMatchArray|null = obfuscatedCode
            .match(/var *(_0x[a-f0-9]{4,6});/);

        const functionParamIdentifierName: string|null = (<RegExpMatchArray>catchClauseParamIdentifierMatch)[1];
        const innerFunctionParamIdentifierName: string|null = (<RegExpMatchArray>innerFunctionParamIdentifierMatch)[1];
        const constructorIdentifierName: string|null = (<RegExpMatchArray>constructorIdentifierMatch)[1];
        const objectIdentifierName: string|null = (<RegExpMatchArray>objectIdentifierMatch)[1];
        const variableDeclarationIdentifierName: string|null = (<RegExpMatchArray>variableDeclarationIdentifierMatch)[1];

        it('should\'t name variables inside inner function with names from catch clause param', () => {
            assert.notEqual(functionParamIdentifierName, constructorIdentifierName);
            assert.notEqual(functionParamIdentifierName, innerFunctionParamIdentifierName);
        });

        it('should correct transform variables inside catch clause body', () => {
            assert.equal(functionParamIdentifierName, objectIdentifierName);
            assert.equal(functionParamIdentifierName, variableDeclarationIdentifierName);
        });

        it('should correct transform variables inside inner function body', () => {
            assert.equal(innerFunctionParamIdentifierName, constructorIdentifierName);
        });

        it('should keep equal names after transformation for variables with same names', () => {
            assert.equal(variableDeclarationIdentifierName, objectIdentifierName);
        });
    });

    describe('wrong replacement', () => {
        it('shouldn\'t replace property node identifier', () => {
            const code: string = readFileAsString(__dirname + '/fixtures/property-identifier.js');

            let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
                code,
                {
                    ...NO_CUSTOM_NODES_PRESET
                }
            );

            assert.match(obfuscationResult.getObfuscatedCode(),  /var _0x([a-f0-9]){4,6} *= *\{'test/);
        });

        it('shouldn\'t replace computed member expression identifier', () => {
            const code: string = readFileAsString(__dirname + '/fixtures/member-expression-identifier.js');

            let obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
                code,
                {
                    ...NO_CUSTOM_NODES_PRESET
                }
            );

            assert.match(obfuscationResult.getObfuscatedCode(),  /_0x([a-f0-9]){4,6}\['test'\]/);
        });
    });

    describe('object pattern as variable declarator', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/object-pattern.js');
        const obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );
        const obfuscatedCode: string = obfuscationResult.getObfuscatedCode();

        it('shouldn\'t transform object pattern variable declarator', () => {
            const objectPatternVariableDeclaratorMatch: RegExp = /var *\{ *bar *\} *= *\{ *'bar' *: *'foo' *\};/;
            const variableUsageMatch: RegExp = /console\['log'\]\(bar\);/;

            assert.match(obfuscatedCode, objectPatternVariableDeclaratorMatch);
            assert.match(obfuscatedCode, variableUsageMatch);
        });
    });

    describe('array pattern as variable declarator', () => {
        const code: string = readFileAsString(__dirname + '/fixtures/array-pattern.js');
        const obfuscationResult: IObfuscationResult = JavaScriptObfuscator.obfuscate(
            code,
            {
                ...NO_CUSTOM_NODES_PRESET
            }
        );
        const obfuscatedCode: string = obfuscationResult.getObfuscatedCode();

        const objectPatternVariableDeclaratorMatch: RegExp = /var *\[ *(_0x([a-f0-9]){4,6}), *(_0x([a-f0-9]){4,6}) *\] *= *\[0x1, *0x2\];/;
        const variableUsageMatch: RegExp = /console\['log'\]\((_0x([a-f0-9]){4,6}), *(_0x([a-f0-9]){4,6})\);/;

        const objectPatternIdentifierName1: string = obfuscatedCode.match(objectPatternVariableDeclaratorMatch)![1];
        const objectPatternIdentifierName2: string = obfuscatedCode.match(objectPatternVariableDeclaratorMatch)![2];
        const identifierName1: string = obfuscatedCode.match(variableUsageMatch)![1];
        const identifierName2: string = obfuscatedCode.match(variableUsageMatch)![2];

        it('should transform array pattern variable declarator', () => {
            assert.match(obfuscatedCode, objectPatternVariableDeclaratorMatch);
            assert.match(obfuscatedCode, variableUsageMatch);
        });

        it('should keep same identifier names same for identifiers in variable declaration and after variable declaration', () => {
            assert.equal(objectPatternIdentifierName1, identifierName1);
            assert.equal(objectPatternIdentifierName2, identifierName2);
        });
    });
});
