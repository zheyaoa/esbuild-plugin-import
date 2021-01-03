import fs from 'fs/promises'
import { Plugin } from 'esbuild'

interface Option {
  libraryName: string,
  libraryDirectory?: string,
  styleLibraryDirectory?: string,
  customName?: (name: string) => string ,
  style?: 'css' | true | ((name:string) => string | false)
}

const componentMap = new Map<string, string>();

const getComponentPath = (importer: string, option: Option):string => {
  const { libraryName, libraryDirectory = 'lib', customName } = option;
  let path = '';
  if(customName){
    path = customName(importer);
  }
  path = `${libraryName}/${libraryDirectory}/${importer}`;
  componentMap.set(importer, path);
  return `import ${importer} from '${path}'`;
}

const getStylePath = (importer: string, option: Option): string => {
  const { styleLibraryDirectory, style } = option;
  const componentPath = componentMap.get(importer);

  if(styleLibraryDirectory){
    return `import '${styleLibraryDirectory}/${importer}'`;
  }
  if(style){
    if( style === true ){
      return `import '${componentPath}/style'`;
    }else if( style === 'css'){
      return `import '${componentPath}/style/css'`;
    }else if(typeof style === 'function'){
      return  `import  ${style(componentPath!) || ''}`;
    }
  }
  return '';
}

export default (option : Option) : Plugin => {
  const { libraryName } = option;
  const reg = new RegExp(`import\\s+{(\\n|\\w|,|\\s)*}\\s+from\\s+(?:'|")${libraryName}(?:'|");?`, 'g')
  return {
    name: 'import',
    setup: ( build ) =>  {
      build.onLoad({ filter:  /\.tsx$/ }, async ({ path }) => {
        let insertBefore = '';
        const content = await fs.readFile(path, 'utf-8');
        const result = content.replace(reg, (match) => {
          const importers = match.slice(match.indexOf("{") + 1, match.indexOf("}")).trim().split(',');
          importers.forEach(importer => {
            const insert = getComponentPath(importer, option) + '\n' + getStylePath(importer, option) + '\n';
            insertBefore += insert;
          });
          return '';
        })
        return {
          contents: insertBefore + result,
          loader: 'tsx'
        }
      });
      build.onLoad({ filter:  /\.css$/ }, async ({ path }) => {
        const contents = await fs.readFile(path, 'utf-8');
        console.log(contents)
        return {
          contents,
          loader: 'css'
        }
      })
    },
  }
};
