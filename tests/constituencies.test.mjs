import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv,validateConstituencyCsv } from "../lib/import/constituencies.mjs";

const count={goa:40,punjab:117};
const header="state_slug,seat_number,seat_name,boundary_version\n";
test("validates sourced numeric seat names, UTF-8 and quoted commas",()=>{
  const input=header+'goa,1,"Pernem, North",current\n'+
    'goa,2,मांद्रे,current\n';
  const value=validateConstituencyCsv(input,count);
  assert.equal(value.regionSlug,"goa");
  assert.equal(value.rows.length,2);
  assert.equal(value.rows[0].name,"Pernem, North");
  assert.equal(value.rows[1].name,"मांद्रे");
});
test("rejects duplicate seats and mixed states",()=>{
  assert.throws(()=>validateConstituencyCsv(header+"goa,1,A,current\ngoa,1,B,current\n",count),/Duplicate/);
  assert.throws(()=>validateConstituencyCsv(header+"goa,1,A,current\npunjab,2,B,current\n",count),/One state/);
});
test("rejects missing seats, malformed CSV, invalid bounds and unknown states",()=>{
  const bad=[
    header+"goa,41,A,current\n",
    header+"goa,0,A,current\n",
    header+"goa,1,,current\n",
    header+"other,1,A,current\n",
    header+'goa,1,"never closed,current\n',
    "seat_number,state_slug,seat_name,boundary_version\ngoa,1,A,current\n",
  ];
  for(const input of bad)assert.throws(()=>validateConstituencyCsv(input,count));
});
test("parses quoted escaped text and CRLF",()=>{
  assert.deepEqual(parseCsv('a,b\r\n"c""d",e\r\n'),[["a","b"],['c"d',"e"]]);
});
