// Strict, dependency-free CSV validation. No claim of official data is made here.
const HEADER=["state_slug","seat_number","seat_name","boundary_version"];

export function parseCsv(text) {
  if(typeof text!=="string"||text.length>2_000_000||text.includes("\0")) {
    throw new Error("CSV must be UTF-8 text under 2 MB without NUL characters");
  }
  const input=text.replace(/^\uFEFF/,"");
  const result=[];
  let row=[],field="",quoted=false,atFieldStart=true;
  const pushField=()=>{row.push(field);field="";atFieldStart=true;};
  const pushRow=()=>{
    pushField();
    if(row.length===1&&row[0]===""){row=[];return;}
    result.push(row);row=[];
    if(result.length>1500)throw new Error("CSV exceeds row limit");
  };
  for(let i=0;i<input.length;i++){
    const char=input[i];
    if(quoted){
      if(char==='"'){
        if(input[i+1]==='"'){field+='"';i++;}
        else quoted=false;
      }else field+=char;
    }else if(char===','){pushField();}
    else if(char==='\n'){pushRow();}
    else if(char==='\r'){
      if(input[i+1]==='\n')i++;
      pushRow();
    }else if(char==='"'){
      if(!atFieldStart)throw new Error("Unexpected quote in CSV field");
      quoted=true;atFieldStart=false;
    }else{field+=char;atFieldStart=false;}
  }
  if(quoted)throw new Error("Unterminated quoted field");
  if(field!==""||row.length)pushRow();
  if(!result.length)throw new Error("CSV is empty");
  return result;
}

export function validateConstituencyCsv(csv, stateCounts) {
  const rows=parseCsv(csv);
  if(rows[0].length!==HEADER.length||HEADER.some((x,i)=>rows[0][i]!==x)){
    throw new Error("Required CSV header: "+HEADER.join(","));
  }
  if(rows.length<2)throw new Error("CSV has no constituency rows");
  const seen=new Set();
  let region="";
  const result=[];
  for(const [index,columns] of rows.slice(1).entries()){
    if(columns.length!==HEADER.length)throw new Error("Wrong number of fields at row "+(index+2));
    const [stateSlug,number,name,version]=columns.map(x=>x.trim());
    if(!Object.hasOwn(stateCounts,stateSlug))throw new Error("Unknown state at row "+(index+2));
    if(region&&region!==stateSlug)throw new Error("One state per import batch is required");
    region=stateSlug;
    if(!/^[1-9]\d*$/.test(number))throw new Error("Invalid seat number at row "+(index+2));
    const seatNumber=Number(number);
    if(!Number.isSafeInteger(seatNumber)||seatNumber>stateCounts[region])throw new Error("Seat number exceeds official planning capacity at row "+(index+2));
    if(!name||name.length>160)throw new Error("Missing or excessively long constituency name");
    if(!version||version.length>80||!/^[\p{L}\p{N}_ .-]+$/u.test(version))throw new Error("Invalid boundary version at row "+(index+2));
    const key=number+"|"+version;
    if(seen.has(key))throw new Error("Duplicate seat number and boundary version: "+number);
    seen.add(key);
    result.push({regionSlug:stateSlug,number:seatNumber,name,boundaryVersion:version});
  }
  return {regionSlug:region,rows:result};
}
