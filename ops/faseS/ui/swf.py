import zlib, struct, sys, collections
def load(p):
    d=open(p,'rb').read()
    body=zlib.decompress(d[8:]) if d[:1]==b'C' else d[8:]
    nbits=body[0]>>3; rb=(5+nbits*4+7)//8
    pos=rb+4
    tags=[]
    while pos+2<=len(body):
        h=struct.unpack_from('<H',body,pos); pos+=2
        code=h[0]>>6; ln=h[0]&0x3f
        if ln==0x3f: ln=struct.unpack_from('<I',body,pos)[0]; pos+=4
        tags.append((code,body[pos:pos+ln])); pos+=ln
        if code==0: break
    return tags
def cstr(b,i):
    j=b.index(0,i); return b[i:j].decode('latin1'), j+1
if __name__=='__main__':
    tags=load(sys.argv[1])
    print(collections.Counter(c for c,_ in tags).most_common(20))
    for c,b in tags:
        if c==1009:
            cid,fmt,w,h=struct.unpack_from('<HHHH',b,0); i=8; n=b[i]; name=b[i+1:i+1+n].decode('latin1'); i+=1+n; m=b[i]; fn=b[i+1:i+1+m].decode('latin1')
            print('img',cid,w,h,name,fn)
        if c==1008:
            print('sub',struct.unpack_from('<HHHHHH',b,0))
