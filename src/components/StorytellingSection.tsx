import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StorytellingParticipacaoSection from '@/components/StorytellingParticipacaoSection';
import StorytellingPersonasSection from '@/components/StorytellingPersonasSection';
import StorytellingCursosSection from '@/components/StorytellingCursosSection';
import StorytellingDiscentesSection from '@/components/StorytellingDiscentesSection';

const StorytellingSection = () => {
  return (
    <Tabs defaultValue="participacao" className="space-y-6">
      <TabsList className="h-auto flex-wrap">
        <TabsTrigger value="participacao">Participação</TabsTrigger>
        <TabsTrigger value="personas">Por persona</TabsTrigger>
        <TabsTrigger value="cursos">Por curso</TabsTrigger>
        <TabsTrigger value="discentes2026">Discentes/2026</TabsTrigger>
        <TabsTrigger value="trienioDiscentes">Triênio Discentes</TabsTrigger>
      </TabsList>
      <TabsContent value="participacao">
        <StorytellingParticipacaoSection />
      </TabsContent>
      <TabsContent value="personas">
        <StorytellingPersonasSection />
      </TabsContent>
      <TabsContent value="cursos">
        <StorytellingCursosSection />
      </TabsContent>
      <TabsContent value="discentes2026">
        <StorytellingDiscentesSection />
      </TabsContent>
      <TabsContent value="trienioDiscentes">
        <StorytellingDiscentesSection trienio />
      </TabsContent>
    </Tabs>
  );
};

export default StorytellingSection;
