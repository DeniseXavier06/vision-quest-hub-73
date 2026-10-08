import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StorytellingParticipacaoSection from '@/components/StorytellingParticipacaoSection';
import StorytellingPersonasSection from '@/components/StorytellingPersonasSection';
import StorytellingCursosSection from '@/components/StorytellingCursosSection';

const StorytellingSection = () => {
  return (
    <Tabs defaultValue="participacao" className="space-y-6">
      <TabsList>
        <TabsTrigger value="participacao">Participação</TabsTrigger>
        <TabsTrigger value="personas">Por persona</TabsTrigger>
        <TabsTrigger value="cursos">Por curso</TabsTrigger>
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
    </Tabs>
  );
};

export default StorytellingSection;
