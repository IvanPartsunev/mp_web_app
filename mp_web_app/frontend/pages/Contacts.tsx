import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Mail, Phone, MapPin} from "lucide-react";

export default function Contacts() {
  return (
    <section className="container mx-auto px-4 py-8">

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Информация за контакт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-3">ГПК „Мурджов пожар"</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p>с. Славейно</p>
                    <p>обл. Смолян</p>
                    <p>ПК 4747</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <a href="mailto:office@murdjovpojar.com" className="hover:text-primary transition-colors">
                    office@murdjovpojar.com
                  </a>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                  <div>
                    <p>
                      <a href="tel:+35930272274" className="hover:text-primary transition-colors">
                        Тел.: 03027/2274
                      </a>
                    </p>
                    <p>
                      <a href="tel:+359887389214" className="hover:text-primary transition-colors">
                        Мобилен: +359 887 389 214
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Maps Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Местоположение</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[300px] rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2982.180295324042!2d24.864303776673903!3d41.63023417127004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14acff4f2e5960ab%3A0xc8d77c90b75423f6!2z0JPQn9CaINCc0KPQoNCU0JbQntCSINCf0J7QltCQ0KA!5e0!3m2!1sbg!2sbg!4v1762644699450!5m2!1sbg!2sbg"
                width="100%"
                height="100%"
                style={{border: 0}}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Местоположение на ГПК Мурджов пожар"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-3 text-center">
              с. Славейно, обл. Смолян
            </p>
          </CardContent>
        </Card>
        {/* Welcome and History Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">За нас</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-justify">

            <div className="pt-4 border-t">
              <p>
                Горовладелческа производителна кооперация «Мурджов пожар» в с. Славейно е една от старите кооперации в
                Смолянския регион и първа в с. Славейно.
              </p>
              <p className="mt-3">
                Учредена е на 20 декември 1924 г. като кооперация на собствениците на ревира «Мурджов пожар»,
                регистрирана в Пашмаклийския окръжен съд с определение № 568 от 18 май 1926 г. В следващите две години
                в Славейно са учредени още две горовладелчески кооперации — «Балийско» и «Черни връх».
              </p>
              <p className="mt-3">
                Със закон за задружното стопанисване на частните гори (ДВ бр.25/1942г.) се въвежда задължителното
                групиране на всички горовладелчески кооперации в едно населено място в една кооперация. Като най-стара и
                с най-добре водена документация «Мурджов пожар» налага своето име при обединението. След възстановяване
                на горите, с решение на собствениците /взето на общо събрание, състояло се на 22 август 1998 г./ ГПК
                «Мурджов пожар» възстановява своята дейност.
              </p>
              <p className="mt-3">
                Членовете на кооперацията в момента са над 1000 и техният брой продължава да расте. Общата площ на
                горите, стопанисвани от кооперацията, е над 26000 дка. От тях на член-кооператори в идеални граници са
                14070 дка, а в реални граници – 11930 дка гори и селско-стопански фонд /ниви и ливади/.
              </p>
              <p className="mt-3">
                В момента кооперацията се занимава с дърводобив и дървопреработка. Годишното производство е между 10 и
                15 хиляди куб.м дърводобив.
              </p>
              <p className="mt-3">
                Имаме вече собствено предприятие за първична преработка на дървесина в с.Славеино. Годишното ни
                производство е между 5 и 10 хиляди куб.м различни продукти, в зависимост от търсенето на пазара.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
