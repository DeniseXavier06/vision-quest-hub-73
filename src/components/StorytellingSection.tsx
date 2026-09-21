import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StorytellingParticipacaoSection from '@/components/StorytellingParticipacaoSection';
import StorytellingPersonasSection from '@/components/StorytellingPersonasSection';

const StorytellingSection = () => {
  return (
    <Tabs defaultValue="participacao" className="space-y-6">
      <TabsList>
        <TabsTrigger value="participacao">Participação</TabsTrigger>
        <TabsTrigger value="personas">Por persona</TabsTrigger>
      </TabsList>
      <TabsContent value="participacao">
        <StorytellingParticipacaoSection />
      </TabsContent>
      <TabsContent value="personas">
        <StorytellingPersonasSection />
      </TabsContent>
    </Tabs>
  );
};

export default StorytellingSection;
