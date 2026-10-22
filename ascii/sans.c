                int/**/putchar(int);
                void/**/p(char*q){
           while(*q)putchar(*q++);}int
        main(int/**/c,char**v){int/**/i,j,k,n
      ,F;double/**/x,y,a,b,t,s;volatile/**/long
      w;char*r=" .:-=+*#%@";char*m="* you feel"
   " like you're gonna have a good time.";for(F=0;
   F<48||c<        2;F++){if(c<2)p        ("\33[H"
   );for             (s=3,k=F%48             ;k--;
   )s*=              .85;for(j=0             ;j<32
   ;j++)     {       for(i=0;i<      64      ;i++)
   {x=-/**/        .743643887+(i-         32)*s/64
   ;y=.131825904+(j-16)*     s/32;for(a=b=k=0;k<
   2048&&a*a+b*b<4;k++)t=a*a-b*b+x,b=2*a*b+y,a=t;
   for(n=0;n*n<2*k;n++);putchar(k>2047?32:r[1+n%9]
   );}                                       /***/
   putchar(  10)   ;}   p(   m);       putchar(10)
      ;if(c                               >1){
      if(F<                               47)p(
        "\f\n");}else/**/for(w=0;w<30000000;w
                ++);}return/**/0;}
